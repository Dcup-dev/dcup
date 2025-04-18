"use server"
import { authDropbox } from "@/fileProcessors/connectors/dropbox";
import { authGoogleDrive } from "@/fileProcessors/connectors/googleDrive";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { revalidatePath } from "next/cache";

type FormState = {
  message: string;
};

export async function newConnection(_: FormState, formData: FormData) {
  const connection = formData.get("connection")
  let redirectUrl: string;

  try {
    switch (connection) {
      case "google-drive":
        redirectUrl = authGoogleDrive()
        break;
      case "dropbox":
        redirectUrl = await authDropbox()
        break;
      case "aws":
        redirectUrl = "/authorized/callback/aws"
        break;
      default:
        throw new Error("Unknown provider");
    }
    revalidatePath("/connections");
    return toFormState("SUCCESS", redirectUrl);
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
