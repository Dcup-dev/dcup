"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod"

const syncConnectionSchema = z.object({
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

type FormState = {
  message: string;
};

export const syncConnectionConfig = async (_: FormState, formData: FormData) => {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.email) throw new Error("forbidden");
    const { id, pageLimit, documentLimit } = syncConnectionSchema.parse({
      id: formData.get("id"),
      pageLimit: formData.get("pageLimit"),
      fileLimit: formData.get("fileLimit")
    })

    const conn = await databaseDrizzle.update(connections).set({
      isSyncing: true,
    }).where(eq(connections.id, id))
      .returning({
        metadata: connections.metadata,
        service: connections.service,
      })

    await addToProcessFilesQueue({
      connectionId: id,
      service: conn[0].service,
      metadata: conn[0].metadata || null,
      pageLimit: pageLimit,
      fileLimit: documentLimit,
      files: [],
      links: []
    })

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
