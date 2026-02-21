"use server";
import { databaseDrizzle } from "@/db";
import { apiKeys } from "@/db/schemas/users";
import { apiKeyGenerator, hashApiKey } from "@/lib/api_key";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

const apiScheme = z.object({
  name: z.string().min(2),
});

type FormState = {
  message: string;
};
export async function generateApiKey(_: FormState, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  try {
    if (!session?.user?.id) throw new Error("forbidden");
    // if (!hasAuthority(plan.toString(), new Date(session.user.createdAt!))) throw new Error("Your free plan has expired. Please subscribe to continue using the app.")

    const parse = apiScheme.parse({
      name: formData.get("name"),
    });
    const apiKey = apiKeyGenerator()
    const hashedKey = hashApiKey(apiKey);

    await databaseDrizzle.insert(apiKeys).values({
      userId: session.user.id,
      name: parse.name,
      generatedTime: new Date(),
      apiKey: hashedKey,
    });
    revalidatePath("/integration");
    return toFormState("SUCCESS", apiKey);
  } catch (e) {
    return fromErrorToFormState(e);
  }
}

export async function deleteApiKey(_: FormState, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  try {
    if (!session?.user?.id) throw new Error("forbidden");
    // if (!hasAuthority(plan.toString(), new Date(session.user.createdAt!))) throw new Error("Your free plan has expired. Please subscribe to continue using the app.")
    const api = formData.get("apikey")
    if (!api) throw new Error("api key required")

    await databaseDrizzle.delete(apiKeys).where(eq(apiKeys.apiKey, api as string))
    revalidatePath("/integration");
    return toFormState("SUCCESS", "Api Key Deleted successfully..");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
