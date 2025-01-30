"use server";
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { apiKeys } from "@/db/schemas/users";
import { apiKeyGenerator, hashApiKey } from "@/lib/api_key";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const apiScheme = z.object({
  name: z.string().min(2),
});

type FormState = {
  message: string;
};
export async function generateApiKey(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.email) throw new Error("forbidden");
    // if (!hasAuthority(plan.toString(), new Date(session.user.createdAt!))) throw new Error("Your free plan has expired. Please subscribe to continue using the app.")

    const parse = apiScheme.parse({
      name: formData.get("name"),
    });
    const apiKey = apiKeyGenerator()
    const hashedKey = hashApiKey(apiKey);

    await databaseDrizzle.insert(apiKeys).values({
      userEmail: session.user.email,
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
