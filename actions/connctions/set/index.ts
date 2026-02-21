"use server"
import { databaseDrizzle } from "@/db";
import { setConnectionToProcess } from "@/fileProcessors/connectors";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { connections } from "@/db/schema";

type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  try {
    if (!session?.user?.id) throw new Error("forbidden");

    formData.set("userId", session.user.id)
    const config = await setConnectionToProcess(formData)
    const jobId = await addToProcessFilesQueue(config)
    await databaseDrizzle.update(connections).set({
      jobId: jobId
    })
    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
