import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";
import { eq } from "drizzle-orm";
import { connections } from "@/db/schemas/connections";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {

  try {
    const { data: userId, error: authError } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { id } = await params
    const { data: conn, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findFirst({
      where: (conn, ops) => ops.and(ops.eq(conn.userId, userId), ops.eq(conn.id, id)),
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
    if (!conn) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "Connection Not Found",
        },
        { status: 404 },
      )
    }

    const response = {
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
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const wait = request.nextUrl.searchParams.get("wait")

  try {
    const { data: userId, error: authError } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { id } = await params
    const { data: conn, error: deleteError } = await tryAndCatch(databaseDrizzle.query.connections.findFirst({
      where: (conn, ops) => ops.and(ops.eq(conn.id, id), ops.eq(conn.userId, userId)),
      columns: {},
      with: {
        files: {
          columns: {
            chunksIds: true
          }
        }
      }
    }))

    if (deleteError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: deleteError.message,
        },
        { status: 500 },
      )
    }
    if (!conn) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "Connection Not Found",
        },
        { status: 404 },
      )
    }

    for (const { chunksIds } of conn.files) {
      await qdrantCLient.delete(qdrant_collection_name, {
        points: chunksIds,
        wait: wait === "true",
      })
    }

    await databaseDrizzle
      .delete(connections)
      .where(eq(connections.id, id))

    return NextResponse.json({
      code: "ok",
      message: "Connection has been successfully deleted",
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
