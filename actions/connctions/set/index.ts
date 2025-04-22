"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { setConnectionToProcess } from "@/fileProcessors/connectors";
import { Plans } from "@/lib/Plans";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type FormState = {
  message: string;
};

export async function setConnectionConfig(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  const service = formData.get("service")
  const connectionId = formData.get("connectionId")
  try {
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
          },
          with: {
            files: {
              columns: {
                totalPages: true,
              }
            }
          }
        }
      }
    })
    if (!user) throw new Error("no such account")
    const plan = Plans[user.plan]

    if (service === "DIRECT_UPLOAD") {
      const used = user.connections.length;
      if (used >= plan.connections) {
        throw new Error(
          `You’ve reached your connection limit for the ${user.plan.toLowerCase()} plan (` +
          `${used}/${plan.connections}). ` +
          `To add more connections, please upgrade your subscription.`
        );
      }
    }

    const pageProcessed = user.connections
      .filter(c => c.id !== connectionId)
      .flatMap(conn => conn.files || [])
      .reduce((sum, file) => sum + (file.totalPages || 0), 0);
    const pageLimit = formData.get("pageLimit")
    const remainingPages = plan.pages - pageProcessed;

    if (pageLimit) {
      if (Number(pageLimit) > remainingPages) {
        throw new Error(
          `You requested to process ${pageLimit} pages, but your ` +
          `${user.plan.toLowerCase()} plan only allows ${remainingPages} ` +
          `more pages this billing period. Please lower the page count or upgrade your plan.`
        );
      } else {
        formData.set("maxPages", pageLimit)
      }
    } else {
      formData.set("maxPages", remainingPages.toString())
    }

    formData.set("userId", session.user.id)
    const config = await setConnectionToProcess(formData)
    await addToProcessFilesQueue(config)
    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
