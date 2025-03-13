"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { newConnectionSchema, deleteConnectionSchema, syncConnectionSchema } from "@/validations/connectionConfigSchema";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
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

    const config = newConnectionSchema.parse({
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
      partition: config.partition,
      metadata: config.metadata,
      isConfigSet: true,
      isSyncing: true,
    }).where(eq(connections.id, config.id))

    console.log("connection ==> start processing")

    await addToProcessFilesQueue({ connectionId: config.id, pageLimit: config.pageLimit, fileLimit: config.documentLimit })

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
    const { id } = deleteConnectionSchema.parse({
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

export const syncConnectionConfig = async (_: FormState, formData: FormData) => {
  const session = await getServerSession(authOptions)

  try {
    if (!session?.user?.email) throw new Error("forbidden");
    const { id, pageLimit, documentLimit } = syncConnectionSchema.parse({
      id: formData.get("id"),
      pageLimit: formData.get("pageLimit"),
      fileLimit: formData.get("fileLimit")
    })

    await databaseDrizzle.update(connections).set({
      isSyncing: false,
    }).where(eq(connections.id, id))

    await addToProcessFilesQueue({ connectionId: id, pageLimit: pageLimit, fileLimit: documentLimit })

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");

  } catch (e) {
    return fromErrorToFormState(e);
  }
}
