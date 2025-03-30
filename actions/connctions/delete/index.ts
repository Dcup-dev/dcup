"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const deleteConnectionSchema = z.object({
  id: z.string().min(2),
});

type FormState = {
  message: string;
};

export async function deleteConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    const { id } = deleteConnectionSchema.parse({
      id: formData.get("id"),
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
