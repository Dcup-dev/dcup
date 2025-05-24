"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { Plans } from "@/lib/Plans";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { addToProcessFilesQueue } from "@/workers/queues/jobs/processFiles.job";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

type FormState = {
  message: string;
};

type Conn = {
  id: string;
  service: "GOOGLE_DRIVE" | "DIRECT_UPLOAD" | "DROPBOX" | "AWS";
  metadata: string | null;
  limitPages: number | null;
  limitFiles: number | null;
  files: {
    totalPages: number;
  }[];
}


export const syncConnectionConfig = async (_: FormState, formData: FormData) => {
  const session = await getServerSession(authOptions)
  const connectionId = formData.get("connectionId")?.toString();
  try {
    if (!session?.user?.id || !connectionId) throw new Error("forbidden");

    const user = await databaseDrizzle.query.users.findFirst({
      where: (u, ops) => ops.eq(u.id, session.user.id!),
      columns: {
        plan: true
      },
      with: {
        connections: {
          columns: {
            id: true,
            metadata: true,
            service: true,
            limitFiles: true,
            limitPages: true,
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

    const { currentConn, othersConn } = user.connections.reduce((acc, c) => {
      if (c.id === connectionId) {
        acc.currentConn = c;
      } else {
        acc.othersConn.push(c)
      }
      return acc;
    }, { currentConn: null as Conn | null, othersConn: [] as Conn[] });

    if (!currentConn) throw new Error("no such connection")
    const jobId = await addToProcessFilesQueue({
      connectionId: connectionId,
      service: currentConn.service,
      metadata: currentConn.metadata || null,
      pageLimit: currentConn.limitPages ?? getLimits(user.plan, othersConn),
      fileLimit: currentConn.limitFiles,
      files: [],
      links: []
    })
    await databaseDrizzle.update(connections).set({
      isSyncing: true,
      jobId: jobId
    }).where(eq(connections.id, connectionId));

    revalidatePath("/connections");
    return toFormState("SUCCESS", "start processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}

const getLimits = (planKey: keyof typeof Plans, othersConn: Conn[]) => {
  const plan = Plans[planKey]
  const pageProcessed = othersConn
    .flatMap(conn => conn.files || [])
    .reduce((sum, file) => sum + (file.totalPages || 0), 0);
  return plan.pages - pageProcessed;
}
