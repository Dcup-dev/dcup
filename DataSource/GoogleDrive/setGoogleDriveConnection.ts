import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { z } from "zod";

const googleDriveConfig = z.object({
  connectionId: z.string().min(2),
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
  const config = googleDriveConfig.safeParse({
    connectionId: formData.get("connectionId"),
    folderName: formData.get("folderName"),
    folderId: formData.get("folderId"),
    partition: formData.get("partition"),
    metadata: formData.get("metadata"),
    pageLimit: formData.get("pageLimit"),
    documentLimit: formData.get("documentLimit"),
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

  await databaseDrizzle.update(connections).set({
    folderName: config.data.folderName,
    connectionMetadata: config.data.folderId ? {
      folderId: config.data.folderId,
    } : undefined,
    partition: config.data.partition ?? undefined,
    metadata: config.data.metadata,
    isConfigSet: true,
    isSyncing: true,
  }).where(eq(connections.id, config.data.connectionId))

  return {
    connectionId: config.data.connectionId,
    service: "GOOGLE_DRIVE",
    pageLimit: config.data.pageLimit,
    fileLimit: config.data.documentLimit,
    metadata: config.data.metadata,
    files: [],
    links: []
  }
}
