"use client"
import { TableCell, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ConnectionQuery, ConnectionToken } from "@/app/(protected)/connections/page";
import { getServiceIcon } from "@/lib/helepers";
import { Check, X, Pickaxe, AlertCircle } from "lucide-react";
import { DataSource } from "@/DataSource";
import { ConnectionProgress } from "@/events";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation";

export default function Connections({ connections, tokens }: { connections: ConnectionQuery[], tokens: ConnectionToken }) {
  const [isMounted, setIsMounted] = useState(false)
  const route = useRouter()
  const [connProgress, setConnProgress] = useState<ConnectionProgress | null>(null);

  useEffect(() => {
    setIsMounted(true)
    const eventSource = new EventSource("/api/progress")
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as ConnectionProgress
      setConnProgress(data)
    }

    eventSource.onerror = () => {
      eventSource.close()
      setConnProgress(null)
    }

    return () => eventSource.close()

  }, [])

  useEffect(() => {
    if (connProgress?.status === 'FINISHED') {
      route.refresh();
    }
  }, [connProgress]);

  return connections.map(connection => {
    const progress = connection.id === connProgress?.connectionId ? connProgress : null;

    return (
      <TableRow key={connection.id}>
        <TableCell className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {getServiceIcon(connection.service)}
            <span data-test="service" className="capitalize">
              {connection.service.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">
            {connection.identifier}
          </p>
        </TableCell>
        <TableCell data-test="folderName" >{connection.folderName || 'Untitled'}</TableCell>
        <TableCell data-test="processedFile" >{progress?.processedFile ?? connection.files.length}</TableCell>
        <TableCell data-test="processedPage" >{progress?.processedPage ?? connection.files.reduce((sum, file) => sum + file.totalPages, 0)}</TableCell>
        <TableCell>
          <span>{!isMounted ? "Loading..." : timeAgo(connection.createdAt)}</span>
        </TableCell>
        <TableCell>
          {!isMounted ? "Loading..." : <LastSync lastSync={progress?.lastAsync ?? connection.lastSynced} />}
        </TableCell>
        <TableCell>
          <ConnectionStatus status={progress?.status} connection={connection} errorMessage={progress?.errorMessage} />
        </TableCell>
        <TableCell>
          <DataSource connection={connection} token={tokens.get(connection.id)} status={progress?.status} />
        </TableCell>
        {progress?.errorMessage && <TableCell>
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {progress?.errorMessage}
            </AlertDescription>
          </Alert>
        </TableCell>}
      </TableRow>)
  });
}

const LastSync = ({ lastSync }: { lastSync: Date | undefined | null }) => {
  if (!lastSync) return <span className="text-muted-foreground">Never</span>
  return <span>{timeAgo(lastSync)}</span>
}

const ConnectionStatus = ({ status, connection, errorMessage }: { status?: "PROCESSING" | "FINISHED", connection: ConnectionQuery, errorMessage?: string }) => {
  return (<TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        {status === 'PROCESSING' || (!status && connection.jobId) ? (
          <Pickaxe className="animate-bounce text-blue-500" />
        ) : errorMessage ? (<X className="text-red-500" />) : (<Check className={connection.isConfigSet || status ? 'text-green-500' : 'text-muted-foreground'} />)}
      </TooltipTrigger>
      <TooltipContent>
        {status === 'FINISHED' || (!status && !connection.jobId) ? errorMessage ? "Sync Failed" : "Sync completed" : "Currently syncing"}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>)
}
