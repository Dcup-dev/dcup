import { connectionProcessFiles, directProcessFiles } from "@/fileProcessors";
import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";
import { setConnectionToProcess } from "@/fileProcessors/connectors";

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

    if (authError) return NextResponse.json({
      code: authError.code,
      message: authError.message,
    }, { status: authError.status })

    const { id } = await params;
    const { data: conn, error: queryError } = await tryAndCatch(databaseDrizzle.query.connections.findFirst({
      where: (conn, ops) => ops.and(ops.eq(conn.id, id), ops.eq(conn.userId, userId)),
      columns: {
        isSyncing: true,
        service: true,
        folderName: true,
      }
    }))
    if (queryError) {
      return NextResponse.json(
        {
          code: "internal_server_error",
          message: "Failed to load connection",
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

    const { data: formData, error: errorForm } = await tryAndCatch(request.formData());
    if (errorForm) return NextResponse.json({
      code: "bad_request",
      message: errorForm.message,
    }, { status: 400 })

    formData.set("userId", userId)
    formData.set("connectionId", id)
    formData.set("folderName", conn.folderName || "*")

    if (conn.service === 'DIRECT_UPLOAD') {
      formData.set("service", "DIRECT_UPLOAD_UPDATE")
    } else {
      formData.set("service", conn.service)
    }

    const {
      data: filesConfig,
      error: errorConfig
    } = await tryAndCatch(setConnectionToProcess(formData))

    if (errorConfig) return NextResponse.json({
      code: "bad_request",
      message: errorConfig.message,
    }, { status: 400 })

    if (wait === "true") {
      const links = formData.getAll("links") || []
      const files = formData.getAll("files") || []

      if (links.length > 0 || files.length > 0) {
        var { error } = await tryAndCatch(directProcessFiles(filesConfig))
      } else {
        var { error } = await tryAndCatch(connectionProcessFiles(filesConfig))
      }

      if (error) return NextResponse.json({
        code: "internal_server_error",
        message: error.message
      }, { status: 500 });

      return NextResponse.json({
        code: "ok",
        message: "Connection successfully updated",
      }, { status: 200 })
    }

    const { error: errorQueue } = await tryAndCatch(addToProcessFilesQueue(filesConfig))
    if (errorQueue) return NextResponse.json({
      code: "internal_server_error",
      message: errorQueue.message,
    }, { status: 500 })

    return NextResponse.json({
      code: "ok",
      message: "Connection has been successfully updated and queued for processing.",
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      code: "internal_server_error",
      message: error.message,
    }, { status: 500 });
  }
}
