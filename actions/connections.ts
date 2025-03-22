"use server"
import { authOptions } from "@/auth";
import { setConnectionToProcess } from "@/DataSource";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { deleteConnectionSchema, syncConnectionSchema } from "@/validations/connectionConfigSchema";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";


type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.email) throw new Error("forbidden");
    const config = await setConnectionToProcess(formData)
    console.log({ connection_to_process: config });

    await addToProcessFilesQueue(config)
    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    console.log({ e })
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
      .where(and(
        eq(connections.id, id),
        eq(connections.isSyncing, false)
      ))

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
      isSyncing: true,
    }).where(eq(connections.id, id))

    await addToProcessFilesQueue({ connectionId: id, pageLimit: pageLimit, fileLimit: documentLimit })

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");

  } catch (e) {
    return fromErrorToFormState(e);
  }
}
