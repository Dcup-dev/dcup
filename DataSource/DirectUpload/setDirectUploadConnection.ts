import { databaseDrizzle } from "@/db";
import { connections, processedFiles } from "@/db/schemas/connections";
import { qdrant_collection_name, qdrantCLient } from "@/qdrant";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const directUploadConfig = z.object({
  userId: z.string().min(5),
  uploadName: z.string().min(1, { message: "Upload Name is required" }),
  partition: z.string().default("default").nullable(),
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
  documentLimit: z.string().nullable().transform((str, ctx): number | null => {
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
})

const updateDirectUploadConfig = z.object({
  connectionId: z.string().min(5),
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
  removedFiles: z.array(z.string().min(5))
})

export const updateDirectUploadConnection = async (formData: FormData) => {

  const config = updateDirectUploadConfig.parse({
    connectionId: formData.get("connectionId"),
    metadata: formData.get("metadata") || "{}",
    files: formData.getAll("files") || [],
    links: formData.getAll("links") || [],
    removedFiles: formData.getAll("removedFiles") || []
  })

  const connectionChunksIds: { chunksIds: string[] }[] = [];

  for (const fileName of config.removedFiles) {
    const files = await databaseDrizzle
      .delete(processedFiles)
      .where(and(
        eq(processedFiles.connectionId, config.connectionId),
        eq(processedFiles.name, fileName)
      )).returning({ chunksIds: processedFiles.chunksIds })
    connectionChunksIds.push(...files)
  }

  for (const { chunksIds } of connectionChunksIds) {
    await qdrantCLient.delete(qdrant_collection_name, {
      points: chunksIds,
    })
  }

  const files = config.files.map(async (file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: await fileToBase64(file),
  }))

  return {
    connectionId: config.connectionId,
    service: "DIRECT_UPLOAD",
    metadata: config.metadata,
    files: await Promise.all(files),
    links: config.links,
    pageLimit: null,
    fileLimit: null
  }
}

export const setDirectUploadConnection = async (formData: FormData) => {

  const config = directUploadConfig.safeParse({
    userId: formData.get("userId"),
    uploadName: formData.get("uploadName"),
    partition: formData.get("partition"),
    metadata: formData.get("metadata") || "{}",
    pageLimit: formData.get("pageLimit"),
    documentLimit: formData.get("documentLimit"),
    files: formData.getAll("files"),
    links: formData.getAll("links"),
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

  const { files, links, userId, uploadName, partition, metadata, documentLimit, pageLimit } = config.data;

  if (files.length === 0 && links.length === 0) {
    throw new Error('Please provide at least one file or link to proceed.')
  }

  const conn = await databaseDrizzle.insert(connections).values({
    userId: userId,
    identifier: uploadName,
    service: 'DIRECT_UPLOAD',
    partition: partition || undefined,
    metadata: metadata,
    isConfigSet: true,
    isSyncing: true,
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
    pageLimit: pageLimit,
    fileLimit: documentLimit
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
