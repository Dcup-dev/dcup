import { databaseDrizzle } from "@/db"
import { processedFiles } from "@/db/schemas/connections"
import { checkAuth } from "@/lib/api_key"
import { tryAndCatch } from "@/lib/try-catch"
import { qdrant_collection_name, qdrantClient } from "@/qdrant"
import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { APIError } from "openai"
import { z } from 'zod'


type Params = {
  params: Promise<{
    id: string
  }>
}

const FilesName = z.object({
  files: z.array(z.string().min(2)).optional(),
  file: z.string().min(2).optional()
}).superRefine((val, ctx) => {
  // Check for both fields present
  if (val.file && val.files) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both 'file' and 'files' fields",
      path: ["file"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Cannot provide both 'files' and 'file' fields",
      path: ["files"],
    });
  }

  // Check for neither field present
  if (!val.file && !val.files) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must provide either 'file' or 'files' field",
      path: ["file"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must provide either 'file' or 'files' field",
      path: ["files"],
    });
  }
});

export async function DELETE(request: NextRequest, { params }: Params) {
  const wait = request.nextUrl.searchParams.get("wait")
  const isWait = wait === "true" || wait === null

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


    const body = await request.json()
    const validation = FilesName.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        code: "invalid_request",
        message: validation.error.errors.map(e => e.message).join(". "),
        example: {
          validFormat1: { file: "document.pdf" },
          validFormat2: { files: ["doc1.pdf", "doc2.pdf"] }
        }
      }, { status: 400 });
    }

    const { id } = await params
    const connectionChunksIds: { chunksIds: string[], name: string }[] = [];
    const connection = await databaseDrizzle.query.connections.findFirst({
      where: (c, ops) => ops.and(ops.eq(c.userId, userId), ops.eq(c.id, id)),
      columns: {
        id: true,
        jobId: true,
      },
    })

    if (!connection) {
      return NextResponse.json({
        code: "unauthorized",
        message: "Connection not found or access denied",
      }, { status: 403 })
    }

    if (connection.jobId) {
      return NextResponse.json(
        {
          code: 'processing_in_progress',
          message: 'Cannot delete while files are being processed. Please cancel the active processing operation first.'
        },
        { status: 409 }
      )
    }
    const filesToDelete = validation.data.file
      ? [validation.data.file]
      : validation.data.files ?? [];


    for (const fileName of filesToDelete) {
      const { data, error } = await tryAndCatch(databaseDrizzle
        .delete(processedFiles)
        .where(and(
          eq(processedFiles.connectionId, id),
          eq(processedFiles.name, fileName)
        )).returning({ chunksIds: processedFiles.chunksIds, name: processedFiles.name }))

      if (error) {
        return NextResponse.json({
          code: "deletion_failed",
          message: "Failed to remove file(s) from database"
        }, { status: 500 });
      }
      connectionChunksIds.push(...data)
    }

    for (const { chunksIds, name } of connectionChunksIds) {
      const { error } = await tryAndCatch(qdrantClient.delete(qdrant_collection_name, {
        points: chunksIds,
        wait: isWait,
        filter: {
          must: [
            { key: "_document_id", match: { value: name } },
            { key: "_userId", match: { value: userId } }
          ]
        }
      }))
      if (error) {
        return NextResponse.json({
          code: "vector_cleanup_failed",
          message: "Failed to delete associated vector data"
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      code: "ok",
      message: `Deleted ${validation.data.file
        ? `'${validation.data.file}'`
        : validation.data.files?.join(", ")
        } successfully${isWait ? "" : " and queued for vector database removal"
        }`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
