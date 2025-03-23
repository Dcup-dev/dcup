import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { z } from "zod";

const directUploadConfig = z.object({
  id: z.string().min(2),
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

export const setDirectUploadConnection = async (formData: FormData) => {

  const config = directUploadConfig.parse({
    id: formData.get("id"),
    partition: formData.get("partition"),
    metadata: formData.get("metadata"),
    pageLimit: formData.get("pageLimit"),
    documentLimit: formData.get("documentLimit"),
  })

<<<<<<< HEAD

  // await databaseDrizzle.update(connections).set({
  //   partition: config.partition ?? undefined,
  //   metadata: config.metadata,
  //   isConfigSet: true,
  //   isSyncing: true,
  // }).where(eq(connections.id, config.id))
=======
  await databaseDrizzle.update(connections).set({
    partition: config.partition ?? undefined,
    metadata: config.metadata,
    isConfigSet: true,
    isSyncing: true,
  }).where(eq(connections.id, config.id))
>>>>>>> 03948f6 (implement connection set for Direct Upload #25)

  return {
    connectionId: config.id,
    pageLimit: config.pageLimit,
    fileLimit: config.documentLimit
  }
}
