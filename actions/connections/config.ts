"use server"

import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { addToProcessFilesQueue } from "@/lib/workers/queues/jobs/processFiles.job";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { connectionConfigSchema, deleteConnectionConfigSchema } from "@/validations/connectionConfigSchema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";


type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.email) throw new Error("forbidden");

    const config = connectionConfigSchema.parse({
      id: formData.get("id"),
      folderName: formData.get("folderName"),
      directory: formData.get("directory"),
      importMode: formData.get("importMode"),
      partition: formData.get("partition"),
      metadata: formData.get("metadata"),
      pageLimit: formData.get("pageLimit"),
      documentLimit: formData.get("documentLimit")
    })

    await databaseDrizzle.update(connections).set({
      folderName: config.folderName,
      directory: config.directory,
      importMode: config.importMode,
      partition: config.partition,
      metadata: config.metadata,
      pagesCount: config.pageLimit ?? undefined,
      documentsCount: config.documentLimit ?? undefined,
      isConfigSet: true,
    }).where(eq(connections.id, config.id))

    await addToProcessFilesQueue({connectionId: config.id})

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");

  } catch (e) {
    return fromErrorToFormState(e);
  }
}


export async function deleteConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    const { id } = deleteConnectionConfigSchema.parse({
      id: formData.get("id")
    })

    await databaseDrizzle
      .delete(connections)
      .where(eq(connections.id, id))

    revalidatePath("/connections");
    return toFormState("SUCCESS", "Connection Deleted Successfully");

  } catch (e) {
    return fromErrorToFormState(e);
  }
}

