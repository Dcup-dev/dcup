import { authOptions } from "@/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link"
import { databaseDrizzle } from "@/db";
import { getServerSession } from "next-auth";
import { redirect } from 'next/navigation';
import { FiCloud, FiDatabase } from "react-icons/fi";
import { SiNotion, SiAwslambda, SiGmail, SiSlack, SiConfluence, SiGoogledrive } from "react-icons/si";
import { ConnectionTable } from "@/db/schemas/connections";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import SourceConfiguration from "@/components/SourceConfiguration/SourceConfiguration";
import { getValidAccessToken } from "@/lib/connectors/googleDrive";
import { DeleteConnection } from "@/components/DeleteConnection/DeleteConnection";
import { SyncConnection } from "@/components/SyncConnection/SyncConnection";



export default async function ConnectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  const connections = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!)
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

      {connections.length === 0 ? (
        <EmptyState />
      ) : (<CurrentConnections connections={connections} />)}
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

async function CurrentConnections({ connections }: { connections: typeof ConnectionTable[] }) {
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'GOOGLE_DRIVE':
        return <SiGoogledrive className="w-5 h-5" />;
      case 'AWS':
        return <SiAwslambda className="w-5 h-5" />;
      case 'NOTION':
        return <SiNotion className="w-5 h-5" />;
      case 'SLACK':
        return <SiSlack className="w-5 h-5" />;
      case 'GMAIL':
        return <SiGmail className="w-5 h-5" />;
      case 'CONFLUENCE':
        return < SiConfluence className="w-5 h-5" />;
      default:
        return <FiCloud className="w-5 h-5" />;
    }
  };

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
            {connections.map((connection, idx) => (
              <TableRow key={idx}>
                <TableCell className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(connection.service)}
                    <span className="capitalize">
                      {connection.service.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {connection.email}
                  </p>
                </TableCell>
                <TableCell>{connection.folderName || 'Untitled'}</TableCell>
                <TableCell>{connection.partition || 'default'}</TableCell>
                <TableCell>{connection.documentsCount}</TableCell>
                <TableCell>{connection.pagesCount}</TableCell>
                <TableCell>
                  {timeAgo(connection.createdAt)}
                </TableCell>
                <TableCell>
                  {connection.lastSynced
                    ? timeAgo(connection.lastSynced)
                    : <span className="text-muted-foreground">Never</span>}
                </TableCell>
                <TableCell>
                  <Source connection={connection} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

async function Source({ connection }: { connection: typeof ConnectionTable }) {
  const token = await getValidAccessToken({
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    expiryDate: Number(connection.expiryDate),
  })
  if (connection.isConfigSet) {
    return <>
      <SyncConnection />
      <SourceConfiguration accessToken={token} currentConnection={connection} />
      <DeleteConnection connectionId={connection.id}/>
    </>
  }
  return (
    <SourceConfiguration accessToken={token} currentConnection={connection} />
  );
}
