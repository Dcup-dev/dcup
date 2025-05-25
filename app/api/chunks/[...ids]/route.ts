import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";
import { arrayContains } from "drizzle-orm";
import { qdrant_collection_name, qdrantClient } from "@/qdrant";

type Params = {
  params: Promise<{
    ids: string[]
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const { ids } = await params

  try {
    const { data: userId, error: authError } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { data: conn, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findMany({
      where: (conn, ops) => ops.eq(conn.userId, userId),
      columns: {},
      with: {
        files: {
          where: (f, ops) => ops.or(...ids.map(id => arrayContains(f.chunksIds, [id]))),
          columns: {
            chunksIds: true,
          }
        }
      }
    }))

    if (queryError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: queryError.message,
        },
        { status: 500 },
      )
    }

    const chunksIds = conn
      .flatMap(e => e.files
        .flatMap(e => e.chunksIds))
      .filter(chunkId => ids.includes(chunkId))

    if (chunksIds.length === 0) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "Chunks Not Found",
        },
        { status: 404 },
      )
    }

    const { data: chunks, error: retrieveError } = await tryAndCatch(qdrantClient.retrieve(qdrant_collection_name, {
      ids: chunksIds,
      with_payload: true,
    }))

    if (retrieveError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: retrieveError.message,
        },
        { status: 500 },
      )
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "Chunks Not Found",
        },
        { status: 404 },
      )
    }

    const response = chunks.map((chunk) => ({
      chunkId: chunk.id,
      fileName: chunk.payload?._document_id,
      source: chunk.payload?._source,
      metadata: chunk.payload?._metadata,
      pageNumber: chunk.payload?._page_number,
      dataType: chunk.payload?._type,
      chunkTitle: chunk.payload?._title,
      chunkSummary: chunk.payload?._summary,
      chunkContent: chunk.payload?._content,
    }))

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
