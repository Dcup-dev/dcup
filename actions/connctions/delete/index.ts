"use server"
import { databaseDrizzle } from "@/db";
import { tryAndCatch } from "@/lib/try-catch";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { qdrant_collection_name, qdrantClient } from "@/qdrant";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";
import { connections, processedFiles } from "@/db/schema";

const deleteConnectionSchema = z.object({
  id: z.string().min(2),
});

type FormState = {
  message: string;
};

export async function deleteConnectionConfig(_: FormState, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    const { id } = deleteConnectionSchema.parse({
      id: formData.get("connectionId"),
    })

    const connectionChunksIds = await databaseDrizzle
      .select({ chunksIds: processedFiles.chunksIds, name: processedFiles.name })
      .from(processedFiles)
      .where(eq(processedFiles.connectionId, id))

    for (const { chunksIds, name } of connectionChunksIds) {
      await tryAndCatch(qdrantClient.delete(qdrant_collection_name, {
        points: chunksIds,
        filter: {
          must: [
            { key: "_document_id", "match": { value: name } },
            { key: "_userId", match: { value: session.user.id } }]
        }
      }))
    }

    await databaseDrizzle
      .delete(connections)
      .where(eq(connections.id, id))

    revalidatePath("/connections");
    return toFormState("SUCCESS", "Connection Deleted Successfully");

  } catch (e) {
    return fromErrorToFormState(e);
  }
}
