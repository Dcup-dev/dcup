import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";



export async function GET(request: NextRequest) {

  try {
    const { data: userId, error: authError } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { data, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findMany({
      where: (conn, ops) => ops.eq(conn.userId, userId),
      columns: {
        id: true,
        identifier: true,
        service: true,
        folderName: true,
        metadata: true,
        isConfigSet: true,
        lastSynced: true,
        createdAt: true,
      },
      with: {
        files: {
          columns: {
            name: true,
            totalPages: true,
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

    const response = data.map(conn => ({
      connectionId: conn.id,
      identifier: conn.identifier,
      source: conn.service,
      sourceFolder: conn.folderName,
      metadata: JSON.parse(conn.metadata || "{}"),
      isConfigSet: conn.isConfigSet,
      lastSynced: conn.lastSynced,
      createdAt: conn.createdAt,
      chunkCount: conn.files.reduce((sum, file) => file.chunksIds.length + sum, 0),
      pageCount: conn.files.reduce((sum, file) => file.totalPages + sum, 0),
      files: conn.files,
    }))

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
