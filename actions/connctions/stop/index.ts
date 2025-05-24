"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { redisConnection } from "@/workers/redis";
import { getServerSession } from "next-auth";

type FormState = {
  message: string;
};

export async function stopProcessing(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions);
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    const connectionId = formData.get("connectionId");
    if (!connectionId) throw new Error("Missing connection id")

    const conn = await databaseDrizzle.query.connections.findFirst({
      where: (c, u) => u.eq(c.id, connectionId.toString()),
      columns: {
        jobId: true,
      }
    })
    if (!conn || !conn.jobId) throw new Error("Connection Not Found or connection not processing in this time")
    await redisConnection.set(`cancel-job:${conn.jobId}`, '1'); 
    return toFormState("SUCCESS", "stop processing");
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
