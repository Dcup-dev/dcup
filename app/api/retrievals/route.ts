import { authOptions } from '@/auth';
import { databaseDrizzle } from '@/db';
import { apiKeys, users } from '@/db/schemas/users';
import { hashApiKey } from '@/lib/api_key';
import { expandQuery, generateHypotheticalAnswer, vectorizeText } from '@/openAi';
import { qdrant_collection_name, qdrantCLient } from '@/qdrant';
import { RetrievalFilter } from '@/validations/retrievalsFilteringSchema'
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'


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

    const auth = request.headers.get("Authorization");
    const bearer = auth?.split("Bearer ")[1]
    if (!auth || !bearer) {
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
      const session = await getServerSession(authOptions)
      userId = session?.user.id
    } else {
      const keyHashed = hashApiKey(auth.split("Bearer ")[1]);
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

    try {
      await databaseDrizzle
        .update(users)
        .set({ apiCalls: sql`${users.apiCalls} + 1` })
        .where(eq(users.id, userId))
    } catch {
      return NextResponse.json(
        {
          code: "forbidden",
          message: "The requested resource was not found.",
        },
        { status: 403 },
      )
    }

    const { query, filter, top_chunk, rerank, min_score_threshold } = validation.data
    const queries = await expandQuery(query)
    const vectors = await vectorizeText(queries)

    const queryPoints = await qdrantCLient.search(qdrant_collection_name, {
      vector: vectors,
      filter: filter ? { must: [{ nested: { key: "_metadata", filter: filter}}] } : undefined,
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
