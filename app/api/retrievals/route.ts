import { databaseDrizzle } from '@/db';
import { hashApiKey } from '@/lib/api_key';
import { Plans } from '@/lib/Plans';
import { expandQuery, generateHypotheticalAnswer, vectorizeText } from '@/openAi';
import { qdrant_collection_name, qdrantClient } from '@/qdrant';
import { RetrievalFilter } from '@/validations/retrievalsFilteringSchema'
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { apiKeys, users } from '@/db/schema';

const UserQuery = z.object({
  query: z.string().min(2),
  top_chunk: z.number().min(1).default(5),
  filter: RetrievalFilter.optional(),
  rerank: z.boolean().default(false).optional(),
  min_score_threshold: z.number().nonnegative().optional()
})

export async function POST(request: NextRequest) {

  try {
    const body = await request.json()
    const validation = UserQuery.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        code: "Invalid_Query",
        message: validation.error.format(),
      },
        { status: 400 },
      );
    }

    const apiKey = request.headers.get("Authorization");
    const bearer = apiKey?.split("Bearer ")[1]
    if (!apiKey || !bearer) {
      return NextResponse.json(
        {
          code: "unauthorized",
          message: "The requested resource was not found.",
        },
        { status: 401 },
      );
    }

    let userId: string | undefined;

    if (bearer === "Dcup_Client") {
      const session = await auth.api.getSession({
        headers: await headers(),
      })
      userId = session?.user.id
    } else {
      const keyHashed = hashApiKey(apiKey.split("Bearer ")[1]);
      const key = await databaseDrizzle
        .select({ userId: apiKeys.userId })
        .from(apiKeys)
        .where(eq(apiKeys.apiKey, keyHashed))
        .limit(1);
      userId = key[0].userId
    }

    if (!userId) {
      return NextResponse.json(
        {
          code: "forbidden",
          message: "The requested resource was not found.",
        },
        { status: 403 },
      );
    }
    const user = await databaseDrizzle.query.users.findFirst({
      where: (u, ops) => ops.eq(u.id, userId),
      columns: {
        plan: true,
        apiCalls: true,
        id:true,
      }
    })

    if (!user) {
      return NextResponse.json({
        code: "User_Not_Found",
        message: "Your account doesn’t exist. Please sign up or contact support."
      }, { status: 404 });
    }

    const retrievalLimit = Plans[user.plan].retrievals;
    const updated = await databaseDrizzle
      .update(users)
      .set({ apiCalls: sql`${user.apiCalls} + 1` })
      .where(
        and(
          eq(user.id, userId),
          sql`${user.apiCalls} < ${retrievalLimit}`
        )
      )
      .returning({ apiCalls: user.apiCalls })
      .then(rows => rows[0]);

    if (!updated) {
      return NextResponse.json({
        code: "Rate_Limit_Exceeded",
        message: `You’ve used all ${retrievalLimit} API calls for your ${user.plan.toLowerCase()} plan this period. ` +
          `Please upgrade to increase your limit.`
      }, {
        status: 429,
        headers: { "Retry-After": "3600" }
      });
    }

    const { query, filter, top_chunk, rerank, min_score_threshold } = validation.data
    const queries = await expandQuery(query)
    const vectors = await vectorizeText(queries)
    const queryPoints = await qdrantClient.search(qdrant_collection_name, {
      vector: vectors,
      filter: filter ? {
        must: [
          { nested: { key: "_metadata", filter: filter } },
          { key: "_userId", match: { value: userId } }
        ]
      } :
        { must: [{ key: "_userId", match: { value: userId } }] },
      limit: rerank ? top_chunk * 2 : top_chunk,
      with_payload: true,
      with_vector: true
    });

    let scoredChunks = queryPoints
      .filter(p => !min_score_threshold || p.score >= min_score_threshold)
      .sort((a, b) => b.score - a.score)
      .map(point => {
        const payload = point.payload!;
        return {
          id: point.id,
          document_name: payload._document_id,
          page_number: payload._page_number,
          chunk_number: payload._chunk_id,
          title: payload._title,
          summary: payload._summary,
          content: payload._content,
          type: payload._type,
          metadata: payload._metadata,
          score: point.score,
        }
      })

    if (rerank) {
      const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
        const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
      }
      // Generate a hypothetical answer for the user's question
      const hypotheticalAnswer = await generateHypotheticalAnswer(query);
      // Compute the embedding for the hypothetical answer
      const hypotheticalEmbedding = await vectorizeText(hypotheticalAnswer);
      // calculate the cosine 
      scoredChunks = queryPoints
        .map(point => ({
          ...point,
          similarity: cosineSimilarity(hypotheticalEmbedding, point.vector as number[])
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, top_chunk)
        .map(point => {
          const payload = point.payload!;
          return {
            id: point.id,
            document_name: payload._document_id,
            page_number: payload._page_number,
            chunk_number: payload._chunk_id,
            source: payload._source,
            title: payload._title,
            summary: payload._summary,
            content: payload._content,
            type: payload._type,
            metadata: payload._metadata,
            score: point.score,
          }
        })
    }

    return NextResponse.json({ scored_chunks: scoredChunks }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
