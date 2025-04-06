import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const fileName = request.nextUrl.searchParams.get("file_name")
  const limitStr = request.nextUrl.searchParams.get("limit")
  const limit = limitStr ? parseInt(limitStr) : undefined

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
      columns: {},
      with: {
        files: {
          where: fileName ? (f, ops) => ops.eq(f.name, fileName) : undefined,
          limit: limit,
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


    if (!conn || conn.files.length === 0) {
      return NextResponse.json(
        {
          code: "not_found",
          message: "File Not Found",
        },
        { status: 404 },
      )
    }

    const response = fileName ? conn.files[0] : conn.files;

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
