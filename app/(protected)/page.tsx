import PipelineFlow from "@/components/PipelineFlow/PipelineFlow";
import { formatDistanceToNow } from 'date-fns'
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConnectionTable, ProcessedFilesTable } from "@/db/schemas/connections";
import { getServiceIcon } from "@/lib/helepers";
import { FaFilePdf } from "react-icons/fa";
import { ApiUsageChart } from "@/components/ApiChart/ApiChart";
import { TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip";

interface FileConnectionQuery extends ConnectionTable {
  files: ProcessedFilesTable[]
}

export default async function page() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const user = await databaseDrizzle.query.users.findFirst({
    where: (u, ops) => ops.eq(u.id, session.user.id!),
    columns: {
      apiCalls: true,
    },
    with: {
      connections: {
        with: {
          files: true,
        }
      }
    }
  })

  if (!user) return redirect("/login")

  return (
    <div className="w-full flex flex-col p-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        RAG Pipeline Dashboard
      </h1>

      {/* Visualization Section */}
      <PipelineFlow connections={user.connections} />

      {/* Data Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Files Table */}
        <div className="w-full xl:w-auto">
          <div className="rounded-lg border shadow-sm h-full">
            <FilesTable connections={user.connections} />
          </div>
        </div>

        {/* API Usage Chart */}
        <div className="w-full xl:w-auto">
          <ApiUsageChart apiUsage={user.apiCalls} />
        </div>
      </div>
    </div>
  )
}


function FilesTable({ connections }: { connections: FileConnectionQuery[] }) {
  const allFiles = connections.flatMap(conn =>
    conn.files.map(file => ({ ...file, connection: conn })))

  if (allFiles.length === 0) return (
    <div className="flex items-center justify-center h-full">
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <div className="mb-4 text-2xl">📁</div>
        <p className="font-medium">No files found</p>
        <p className="text-sm mt-1">Connect your storage to get started</p>
      </div>
    </div>
  )

  return (
    <div className="relative overflow-hidden">
      <Table className="[&_td]:align-middle min-w-[700px] lg:min-w-0">
        <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5" >File</TableHead>
            <TableHead className="pl-10">Source</TableHead>
            <TableHead className="text-center">Pages</TableHead>
            <TableHead className="text-center">Last Synced</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {allFiles.map((file) => (
            <TableRow
              key={file.name}
              className="transition-colors hover:bg-gray-50/30 dark:hover:bg-gray-800/20"
            >
              <TableCell className="pl-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <FaFilePdf className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.name}
                  </span>
                </div>
              </TableCell>

              <TableCell className="pl-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    {getServiceIcon(file.connection.service)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium capitalize truncate">
                      {file.connection.service.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {file.connection.email}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-center py-4">
                <span className="font-mono text-sm">
                  {file.totalPages.toLocaleString()}
                </span>
              </TableCell>

              <TableCell className="text-center py-4">
                <Tooltip>

                  <TooltipTrigger>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(file.connection.lastSynced || ""), {
                        addSuffix: true
                      })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {new Date(file.connection.lastSynced || "").toLocaleString()}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>)
}
