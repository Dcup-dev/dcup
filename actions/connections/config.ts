"use server"

import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { connectionConfigSchema } from "@/validations/connectionConfigSchema";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";


type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.id) throw new Error("forbidden");

    const config = connectionConfigSchema.parse({
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
      metadata: config.metadata?.toString(),
      pagesCount: config.pageLimit ?? undefined,
      documentsCount: config.documentLimit ?? undefined
    })

    // call the processing job using BullQM: TODO

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");

  } catch (e) {
    return fromErrorToFormState(e);
  }

}
