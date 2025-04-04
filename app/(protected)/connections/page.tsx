import Link from "next/link"
import dynamic from 'next/dynamic'
import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { ConnectionTable } from "@/db/schemas/connections";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getConnectionToken } from "@/fileProcessors/connectors";
import { FiDatabase } from "react-icons/fi";
import { SetNewConfigDirect } from "@/DataSource/DirectUpload/SetNewConfigDirect/SetNewConfigDirect";

const Connections = dynamic(() => import('@/components/Connections/Connections'))


export interface ConnectionQuery extends ConnectionTable {
  files: {
    totalPages: number,
    name: string,
  }[]
}
export type ConnectionToken = Map<string, string | null>;

export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const connections: ConnectionQuery[] = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!),
    with: {
      files: {
        columns: {
          totalPages: true,
          name: true,
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
          <SetNewConfigDirect />
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
  const tokens: ConnectionToken = new Map()
  for (const conn of connections) {
    const token = await getConnectionToken(conn)
    tokens.set(conn.id, token || null)
  }

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
            <Connections connections={connections} tokens={tokens} />
          </TableBody>
        </Table>
      </div>
    </div>
  );
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
