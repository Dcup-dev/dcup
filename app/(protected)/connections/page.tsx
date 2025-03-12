import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { FiDatabase } from "react-icons/fi";
import { connections, ConnectionTable } from "@/db/schemas/connections";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SourceConfiguration from "@/components/SourceConfiguration/SourceConfiguration";
import { DeleteConnection } from "@/components/DeleteConnection/DeleteConnection";
import { SyncConnection } from "@/components/SyncConnection/SyncConnection";
import { eq } from "drizzle-orm";
import { AlertCircle } from "lucide-react";
import { getOAuth2Client } from "@/fileProcessors/connectors/googleDrive";
import dynamic from 'next/dynamic'
 
const ConnectionDetails  = dynamic(() => import('@/components/ConnectionDetails/ConnectionDetails'), {
  ssr:true
})

type ConnectionSelection = typeof ConnectionTable;
export interface ConnectionQuery extends ConnectionSelection {
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
        <Button asChild className="mt-4 md:mt-0">
          <Link href={"/connections/new"}>
            New Connection
          </Link>
        </Button>
      </div>
      {connections.length === 0 ? (<EmptyState />)
        : (<CurrentConnections connections={connections} />)}
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

async function CurrentConnections({ connections }: { connections: ConnectionQuery[] }) {

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-6">Active Connections</h2>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Source</TableHead>
              <TableHead>Directory</TableHead>
              <TableHead>Partition</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Last Synced</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {connections.map((connection, idx) => (<ConnectionDetails connection={connection} key={idx}>
              <Source connection={connection} />
            </ConnectionDetails>))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

async function Source({ connection }: { connection: typeof ConnectionTable }) {
  try {
    const { token } = await getOAuth2Client({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      expiryDate: Number(connection.expiryDate),
    }).getAccessToken()

    if (connection.isConfigSet) {
      return <>
        <SyncConnection />
        <SourceConfiguration accessToken={token} currentConnection={connection} />
        <DeleteConnection connectionId={connection.id} />
      </>
    }
    return (
      <SourceConfiguration accessToken={token} currentConnection={connection} />
    );
  } catch (error: any) {
    if (error.message.includes("invalid_grant")) {
      await databaseDrizzle
        .delete(connections)
        .where(eq(connections.id, connection.id));

      return <ConnectionError message={"This connection is no longer valid. Please reconnect your account."} />
    }
    return <ConnectionError message={" An unexpected error occurred while authenticating."} />
  }
}

function ConnectionError({ message }: { message: string }) {
  return (
    <div className="flex items-center space-x-3 rounded-md border border-red-400 bg-red-50 p-4">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <span className="text-sm font-medium text-red-700">
        {message}
      </span>
    </div>
  );
}
