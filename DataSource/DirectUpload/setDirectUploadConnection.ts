import { databaseDrizzle } from "@/db";
import { connections, processedFiles } from "@/db/schemas/connections";
import { tryAndCatch } from "@/lib/try-catch";
import { qdrant_collection_name, qdrantClient } from "@/qdrant";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const directUploadConfig = z.object({
  userId: z.string().min(5),
  identifier: z.string().min(2),
  metadata: z.string()
    .transform((str, ctx): string => {
      try {
        if (str) {
          JSON.parse(str)
          return str
        }
        return "{}"
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
        return z.NEVER
      }
    }),
  pageLimit: z.string().nullable().transform((str, ctx): number | null => {
    try {
      if (str) return parseInt(str)
      return null
    } catch (error) {
      ctx.addIssue({ code: 'invalid_date', message: "invalid page limit" })
      return z.NEVER
    }
  }),
  fileLimit: z.string().nullable().transform((str, ctx): number | null => {
    try {
      if (str) return parseInt(str)
      return null
    } catch (error) {
      ctx.addIssue({ code: 'invalid_date', message: "invalid page limit" })
      return z.NEVER
    }
  }),
  files: z.array(z.any().refine((file) => {
    return (
      file ||
      (file instanceof File && file.type === "application/pdf")
    );
  },
    {
      message: "Invalid File",
    })
  ),
  links: z.array(z.string().min(5)),
  texts: z.array(z.string().min(5)),
})

const updateDirectUploadConfig = z.object({
  userId: z.string().min(5),
  connectionId: z.string().min(5),
  pageLimit: z.string().nullable().transform((str, ctx): number | null => {
    try {
      if (str) return parseInt(str)
      return null
    } catch (error) {
      ctx.addIssue({ code: 'invalid_date', message: "invalid page limit" })
      return z.NEVER
    }
  }),
  identifier: z.string().min(2).optional(),
  metadata: z.string().optional()
    .transform((str, ctx): string | undefined => {
      try {
        if (str) {
          JSON.parse(str)
          return str
        }
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
        return z.NEVER
      }
    }),
  files: z.array(z.any().refine((file) => {
    return (
      file ||
      (file instanceof File && file.type === "application/pdf")
    );
  },
    {
      message: "Invalid File",
    })
  ),
  links: z.array(z.string().min(5)),
  texts: z.array(z.string().min(5)),
  removedFiles: z.array(z.string().min(5))
})

export const updateDirectUploadConnection = async (formData: FormData) => {
  const config = updateDirectUploadConfig.safeParse({
    userId: formData.get("userId"),
    connectionId: formData.get("connectionId"),
    identifier: formData.get("identifier"),
    metadata: formData.get("metadata") || "{}",
    files: formData.getAll("files") || [],
    links: formData.getAll("links") || [],
    texts: formData.getAll("texts") || [],
    removedFiles: formData.getAll("removedFiles") || [],
    pageLimit: formData.get("pageLimit")
  })

  if (!config.success) {
    const errors = config.error.errors
      .map(err => {
        const fieldPath = err.path.length > 0 ? err.path.join('.') : 'value'
        return `"${fieldPath}": ${err.message}`
      })
      .join('; ')
    throw new Error(`Validation errors - ${errors}`)
  }

  const connectionChunksIds: { chunksIds: string[], name: string }[] = [];

  await databaseDrizzle
    .update(connections)
    .set({
      metadata: config.data.metadata,
      identifier: config.data.identifier
    }).where(eq(connections.id, config.data.connectionId))

  for (const fileName of config.data.removedFiles) {
    const files = await databaseDrizzle
      .delete(processedFiles)
      .where(and(
        eq(processedFiles.connectionId, config.data.connectionId),
        eq(processedFiles.name, fileName)
      )).returning({ chunksIds: processedFiles.chunksIds, name: processedFiles.name })
    connectionChunksIds.push(...files)
  }

  for (const { chunksIds, name } of connectionChunksIds) {
    await tryAndCatch(qdrantClient.delete(qdrant_collection_name, {
      points: chunksIds,
      filter: {
        must: [{ "key": "_document_id", "match": { value: name } },
        { key: "_userId", match: { value: config.data.userId } }]
      }
    }))
  }

  const files = config.data.files.map(async (file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: await fileToBase64(file),
  }))

  return {
    connectionId: config.data.connectionId,
    service: "DIRECT_UPLOAD",
    metadata: config.data.metadata ?? "{}",
    files: await Promise.all(files),
    links: config.data.links,
    texts: config.data.texts,
    pageLimit: config.data.pageLimit,
    fileLimit: null
  }
}

export const setDirectUploadConnection = async (formData: FormData) => {
  const config = directUploadConfig.safeParse({
    userId: formData.get("userId"),
    identifier: formData.get("identifier"),
    metadata: formData.get("metadata") || "{}",
    pageLimit: formData.get("pageLimit"),
    fileLimit: formData.get("fileLimit"),
    files: formData.getAll("files"),
    links: formData.getAll("links"),
    texts: formData.getAll("texts")
  })

  if (!config.success) {
    const errors = config.error.errors
      .map(err => {
        const fieldPath = err.path.length > 0 ? err.path.join('.') : 'value'
        return `"${fieldPath}": ${err.message}`
      })
      .join('; ')
    throw new Error(`Validation errors - ${errors}`)
  }

  const { files, links, userId, identifier, metadata, fileLimit, pageLimit, texts } = config.data;

  if (files.length === 0 && links.length === 0 && texts.length === 0) {
    throw new Error('Please provide at least one file or link to proceed.')
  }

  const conn = await databaseDrizzle.insert(connections).values({
    userId: userId,
    identifier: identifier,
    service: 'DIRECT_UPLOAD',
    metadata: metadata,
    isConfigSet: true,
    limitPages: pageLimit,
    limitFiles: fileLimit,
  }).returning({ id: connections.id })

  const allFiles = files.map(async (file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: await fileToBase64(file),
  }))

  return {
    connectionId: conn[0].id,
    service: "DIRECT_UPLOAD",
    metadata: metadata,
    files: await Promise.all(allFiles),
    links: links,
    texts: texts,
    pageLimit: config.data.pageLimit,
    fileLimit: fileLimit
  }
}

const fileToBase64 = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};
