import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";
import { users } from "@/db/schemas/users";
import { eq, sql } from "drizzle-orm";

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

    const { error: updateApiCallsError } = await tryAndCatch(databaseDrizzle
      .update(users)
      .set({ apiCalls: sql`${users.apiCalls} + 1` })
      .where(eq(users.id, userId)))

    if (updateApiCallsError) {
      return NextResponse.json(
        {
          code: "forbidden",
          message: "The requested resource was not found.",
        },
        { status: 403 },
      )
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
