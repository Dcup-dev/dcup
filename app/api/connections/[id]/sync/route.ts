import { databaseDrizzle } from "@/db"
import { connectionProcessFiles } from "@/fileProcessors"
import { checkAuth } from "@/lib/api_key"
import { tryAndCatch } from "@/lib/try-catch"
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job"
import { NextRequest, NextResponse } from "next/server"
import { APIError } from "openai"


type Params = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, { params }: Params) {
  const wait = request.nextUrl.searchParams.get("wait")

  try {
    const {
      data: userId,
      error: authError,
    } = await tryAndCatch<string, APIError>(checkAuth(request))
    if (authError) {
      return NextResponse.json({
        code: authError.code,
        message: authError.message,
      }, { status: authError.status })
    }

    const { id } = await params
    const { data: conn, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findFirst({
      where: (conn, ops) => ops.and(ops.eq(conn.userId, userId!), ops.eq(conn.id, id)),
      columns: {
        id: true,
        service: true,
        isConfigSet: true,
        isSyncing: true,
        metadata: true
      },
      with: {
        files: {
          columns: {
            totalPages: true,

          }
        },
      }
    }))
    if (queryError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: "Failed to load connection status",
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
    if (!conn.isConfigSet) {
      return NextResponse.json(
        {
          code: 'config_missing',
          message:
            'This connection is not fully configured',
        },
        { status: 400 },
      )
    }
    if (conn.isSyncing) {
      return NextResponse.json(
        {
          code: 'already_syncing',
          message:
            'A sync operation is already in progress for this connection',
        },
        { status: 400 },
      )
    }

    const filesConfig = {
      connectionId: conn.id,
      service: conn.service,
      pageLimit: conn.files.reduce((sum, f) => f.totalPages + sum, 0),
      fileLimit: conn.files.length,
      metadata: conn.metadata || null,
      links: [],
      files: []

    }

    if (wait === "true") {
      const { error } = await tryAndCatch(connectionProcessFiles(filesConfig))
      if (error) return NextResponse.json({
        code: "internal_server_error",
        message: error.message
      }, { status: 500 });

      return NextResponse.json({
        code: "ok",
        message: "Your file was successfully synced and processed",
      }, { status: 200 })
    }

    const { error: errorQueue } = await tryAndCatch(addToProcessFilesQueue(filesConfig))
    if (errorQueue) return NextResponse.json({
      code: "internal_server_error",
      message: errorQueue.message,
    }, { status: 500 })

    return NextResponse.json({
      code: "ok",
      message: "Your file has been successfully queued for syncing",
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
