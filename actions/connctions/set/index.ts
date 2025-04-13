"use server"
import { authOptions } from "@/auth";
import { setConnectionToProcess } from "@/fileProcessors/connectors";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    formData.set("userId", session.user.id)
    const config = await setConnectionToProcess(formData)

    await addToProcessFilesQueue(config)
    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
