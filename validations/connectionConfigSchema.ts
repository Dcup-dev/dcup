import { z } from "zod";

export const deleteConnectionSchema = z.object({
  id: z.string().min(2),
});

export const syncConnectionSchema = z.object({
  id: z.string().min(2),
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
