import Link from "next/link"
import dynamic from 'next/dynamic'
import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { ConnectionTable } from "@/db/schemas/connections";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataSource } from "@/DataSource";
import { getConnectionToken } from "@/fileProcessors/connectors";
import { DirectUploadPicker } from "@/DataSource/DirectUpload/DirectUploadPicker/DirectUploadPicker";
import { ConnectionProvider } from "@/context/connectionContext";
import { tryAndCatch } from "@/lib/try-catch";
import { FiDatabase } from "react-icons/fi";

const ConnectionDetails = dynamic(() => import('@/components/ConnectionDetails/ConnectionDetails'))

export interface ConnectionQuery extends ConnectionTable {
  files: {
    totalPages: number
  }[]
}

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const connections: ConnectionQuery[] = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!),
    with: {
      files: {
        columns: {
          totalPages: true
        }
      }
    }
  })

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Connected Services
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage your data sources and keep your application in sync.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <DirectUploadPicker />
          <Button asChild>
            <Link href={"/connections/new"}>
              New Connection
            </Link>
          </Button>
        </div>
      </div>

      {connections.length === 0 ? (<EmptyState />)
        : (<CurrentConnections connections={connections} />)}
    </div>
  );
}

async function CurrentConnections({ connections }: { connections: ConnectionQuery[] }) {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-6">Active Connections</h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Source</TableHead>
              <TableHead>Directory</TableHead>
              <TableHead>Partition</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Last Synced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <ConnectionProvider>
              {connections.map((conn, idx) => <ConnectionDetails key={idx} connection={conn} >
                <Connection connection={conn} />
              </ConnectionDetails>)}
            </ConnectionProvider>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

async function Connection({ connection }: { connection: ConnectionQuery }) {
  const { data } = await tryAndCatch(getConnectionToken(connection))
  return (<DataSource connection={connection} token={data ?? "invalid_grant"} />)
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center p-6">
      <div className="bg-muted p-4 rounded-full mb-4">
        <FiDatabase className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold">No Connected Sources</h2>
      <p className="text-muted-foreground max-w-md">
        Connect your first data source to start syncing documents and pages with your application. We support Google Drive, Notion, AWS, and more.
      </p>
    </div>
  );
}
