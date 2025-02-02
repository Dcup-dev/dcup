"use server";
import { authOptions } from "@/auth";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { sign } from 'jsonwebtoken'
import { z } from "zod";


const dcupScheme = z.object({
  links: z.array(z.string()).nullable(),
});

type FormState = {
  message: string;
};
export async function dcupProxy(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  let response: Response | null = null

  try {
    if (!session?.user?.email) throw new Error("Unauthorized");

    const { links } = dcupScheme.parse({
      links: formData.getAll("links"),
    });

    const jwtKey = sign({ sub: session.user?.email }, process.env.API_ACCESS_SECRET as string, {
      expiresIn: '1m',
    })

    const baseUrl = `${process.env.DCUPCORE}/v1/clean`;

    if (links) {

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
