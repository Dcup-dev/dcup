import { z } from "zod";

export const connectionConfigSchema = z.object({
  id: z.string().min(2),
  folderName: z.string().transform((str): string | null => {
    if (str) return str
    return "*"
  }),
  directory:z.string(), 
  importMode: z.enum(["Fast", "Hi-res"]).default("Fast"),
  partition: z.string().default("default"),
  metadata: z.string()
    .transform((str, ctx): string => {
      try {
        if (str) {
          JSON.parse(str)
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

export const deleteConnectionConfigSchema = z.object({
  id: z.string().min(2),
});
