import PipelineFlow from "@/components/PipelineFlow/PipelineFlow";
import { ConnectionQuery } from "./connections/page";
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from 'next/navigation';

export default async function page() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const connections: ConnectionQuery[] = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!),
    with: {
      files: true
    }
  })

  return (<div className="w-full flex flex-col items-center gap-2">
    <h1>RAG Pipeline Visualization</h1>
    <PipelineFlow connections={connections} />
  </div>)
}
