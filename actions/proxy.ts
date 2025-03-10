"use server";
import { authOptions } from "@/auth";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { sign } from 'jsonwebtoken'
import { z } from "zod";


const dcupScheme = z.object({
  links: z.array(z.string()),
});

type FormState = {
  message: string;
};

export async function processDataProxy(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  let response: Response | null = null

  try {
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { links } = dcupScheme.parse({
      links: formData.getAll("links"),
    });

    const jwtKey = sign({ sub: session.user?.id }, process.env.API_ACCESS_SECRET as string, {
      expiresIn: '1m',
    })

    const baseUrl = `${process.env.DCUPCORE}/v1/clean`;

    if (links.length > 0) {

      const url = new URL(baseUrl);
      links.forEach(link => {
        url.searchParams.append('url', link);
      });
      formData.delete("links")

      response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtKey}`,
        },
        body: formData,
      });
    } else {
      response = await fetch(`${baseUrl}/file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwtKey}`,
        },
        body: formData,
      });
    }

    const resBody = await response.json();
    revalidatePath("/dashboard");
    if (!response.ok) throw new Error(resBody.error || "Failed to process Data");
    return toFormState("SUCCESS", JSON.stringify(resBody.schema));
  } catch (e) {
    return fromErrorToFormState(e);
  }
}

const apiKeyScheme = z.object({
  apiKey: z.string().min(5),
});

export async function deleteApiKeyProxy(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { apiKey } = apiKeyScheme.parse({
      apiKey: formData.get("apikey"),
    });

    const jwtKey = sign({ sub: session.user?.id }, process.env.API_ACCESS_SECRET as string, {
      expiresIn: '1m',
    })

    const url = `${process.env.DCUPCORE}/v1/key/${apiKey}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${jwtKey}`,
      },
    });

    const resBody = await response.json();
    revalidatePath("/integration");
    if (!response.ok) throw new Error(resBody.error || "Failed to process Data");
    return toFormState("SUCCESS",resBody.message);
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
