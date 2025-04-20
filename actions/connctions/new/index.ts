"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { authDropbox } from "@/fileProcessors/connectors/dropbox";
import { authGoogleDrive } from "@/fileProcessors/connectors/googleDrive";
import { Plans } from "@/lib/Plans";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type FormState = {
  message: string;
};

export async function newConnection(_: FormState, formData: FormData) {
  const connection = formData.get("connection")
  let redirectUrl: string;

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error("forbidden");
    const user = await databaseDrizzle.query.users.findFirst({
      where: (u, ops) => ops.eq(u.id, session.user.id!),
      columns: {
        plan: true,
      },
      with: {
        connections: {
          columns: {
            id: true,
          }
        }
      }
    })
    if (!user) throw new Error("no such account")
    const plan = Plans[user.plan]
    const used = user.connections.length;
    if (used >= plan.connections) {
      throw new Error(
        `You’ve reached your connection limit for the ${user.plan.toLowerCase()} plan (` +
        `${used}/${plan.connections}). ` +
        `To add more connections, please upgrade your subscription.`
      );
    }

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
