import { checkAuth } from "@/lib/api_key";
import { tryAndCatch } from "@/lib/try-catch";
import { NextRequest, NextResponse } from "next/server";
import { APIError } from "@/lib/APIError";
import { databaseDrizzle } from "@/db";
import { eq } from "drizzle-orm";
import { qdrant_collection_name, qdrantClient } from "@/qdrant";
import { setConnectionToProcess } from "@/fileProcessors/connectors";
import { connectionProcessFiles, directProcessFiles } from "@/fileProcessors";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { connections } from "@/db/schema";

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
      columns: {
        jobId: true,
      },
      with: {
        files: {
          columns: {
            chunksIds: true,
            name: true,
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

    if (conn.jobId) {
      return NextResponse.json(
        {
          code: 'processing_in_progress',
          message: 'Cannot delete while files are being processed. Please cancel the active processing operation first.'
        },
        { status: 409 }
      )
    }
    for (const { chunksIds, name } of conn.files) {
      await tryAndCatch(qdrantClient.delete(qdrant_collection_name, {
        points: chunksIds,
        wait: wait === "true",
        filter: {
          must: [
            { key: "_document_id", match: { value: name } },
            { key: "_userId", match: { value: userId } },
          ]
        }
      }))
    }

    await tryAndCatch(databaseDrizzle
      .delete(connections)
      .where(eq(connections.id, id)))

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

export async function PUT(request: NextRequest, { params }: Params) {
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
        service: true,
        folderName: true,
        jobId: true,
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

    if (conn.jobId) {
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

      let error: Error | null = null;
      if (links.length > 0 || files.length > 0) {
        const { error: err } = await tryAndCatch(directProcessFiles(filesConfig))
        error = err;
      } else {
        const { error: err } = await tryAndCatch(connectionProcessFiles(filesConfig))
        error = err
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
