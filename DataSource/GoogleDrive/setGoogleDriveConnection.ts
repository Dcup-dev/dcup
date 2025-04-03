import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { z } from "zod";

const googleDriveConfig = z.object({
  id: z.string().min(2),
  folderName: z.string().transform((str): string => {
    if (str) return str
    return "*"
  }),
  folderId: z.string().nullable(),
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
})

export const setGoogleDriveConnection = async (formData: FormData) => {
  const config = googleDriveConfig.parse({
    id: formData.get("id"),
    folderName: formData.get("folderName"),
    folderId: formData.get("folderId"),
    partition: formData.get("partition"),
    metadata: formData.get("metadata"),
    pageLimit: formData.get("pageLimit"),
    documentLimit: formData.get("documentLimit"),
  })

  await databaseDrizzle.update(connections).set({
    folderName: config.folderName,
    connectionMetadata: config.folderId ? {
      folderId: config.folderId,
    } : undefined,
    partition: config.partition ?? undefined,
    metadata: config.metadata,
    isConfigSet: true,
    isSyncing: true,
  }).where(eq(connections.id, config.id))

  return {
    connectionId: config.id,
    service: "GOOGLE_DRIVE",
    pageLimit: config.pageLimit,
    fileLimit: config.documentLimit,
    metadata: config.metadata,
    files: [],
    links: []
  }
}
