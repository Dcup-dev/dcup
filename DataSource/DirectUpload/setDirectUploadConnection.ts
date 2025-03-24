import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
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

export const setDirectUploadConnection = async (formData: FormData) => {

  const config = directUploadConfig.parse({
    userId: formData.get("userId"),
    uploadName: formData.get("uploadName"),
    partition: formData.get("partition"),
    metadata: formData.get("metadata"),
    pageLimit: formData.get("pageLimit"),
    documentLimit: formData.get("documentLimit"),
    files: formData.getAll("files"),
    links: formData.getAll("links"),
  })


  if (config.files.length === 0 && config.links.length === 0) {
    throw new Error("no file or links privided")
  }

  const conn = await databaseDrizzle.insert(connections).values({
    userId: config.userId,
    identifier: config.uploadName,
    service: 'DIRECT_UPLOAD',
    partition: config.partition || undefined,
    metadata: config.metadata,
    isConfigSet: true,
    isSyncing: true,
  }).returning({ id: connections.id })

  const files = config.files.map(async (file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content: await fileToBase64(file),
  }))

  return {
    connectionId: conn[0].id,
    service: "DIRECT_UPLOAD",
    metadata: config.metadata,
    files: await Promise.all(files),
    links: config.links,
    pageLimit: config.pageLimit,
    fileLimit: config.documentLimit
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
