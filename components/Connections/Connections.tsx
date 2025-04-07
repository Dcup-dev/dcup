"use client"
import { TableCell, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ConnectionQuery, ConnectionToken } from "@/app/(protected)/connections/page";
import { getServiceIcon } from "@/lib/helepers";
import { Check, Pickaxe } from "lucide-react";
import { DataSource } from "@/DataSource";
import { ConnectionProgress } from "@/events";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Connections({ connections, tokens }: { connections: ConnectionQuery[], tokens: ConnectionToken }) {
  const [isMounted, setIsMounted] = useState(false)
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

  }, [setConnProgress, connProgress])

  return connections.map(connection => {
    const progress = connection.id === connProgress?.connectionId ? connProgress : null;

    return (<TableRow key={connection.id}>
      <TableCell className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {getServiceIcon(connection.service)}
          <span className="capitalize">
            {connection.service.toLowerCase().replace('_', ' ')}
          </span>
        </div>
        <p className="text-muted-foreground">
          {connection.identifier}
        </p>
      </TableCell>
      <TableCell>{connection.folderName || 'Untitled'}</TableCell>
      <TableCell>{connection.partition || 'default'}</TableCell>
      <TableCell>{progress?.processedFile || connection.files.reduce((sum, file) => sum + file.totalPages, 0)}</TableCell>
      <TableCell>{progress?.processedPage || connection.files.length}</TableCell>
      <TableCell>
        <span>{!isMounted ? "Loading..." : timeAgo(connection.createdAt)}</span>
      </TableCell>
      <TableCell>
        {!isMounted ? "Loading..." : <LastSync lastSync={progress?.lastAsync ?? connection.lastSynced} />}
      </TableCell>
      <TableCell>
        <ConnectionStatus status={progress?.status} />
      </TableCell>
      <TableCell>
        <DataSource connection={connection} token={tokens.get(connection.id)} status={progress?.status} />
      </TableCell>
    </TableRow>)
  });
}

const LastSync = ({ lastSync }: { lastSync: Date | undefined | null }) => {
  if (!lastSync) return <span className="text-muted-foreground">Never</span>
  return <span>{timeAgo(lastSync)}</span>
}

const ConnectionStatus = ({ status }: { status: "PROCESSING" | "FINISHED" | undefined }) => {

  if (!status) return (<TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Check className="text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>
        Sync completed
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>)

  return (<TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        {status === 'PROCESSING' ? (
          <Pickaxe className="animate-bounce text-blue-500" />
        ) : (<Check className="text-green-500" />)}
      </TooltipTrigger>
      <TooltipContent>
        {status === 'FINISHED' ? "Sync completed" : "Currently syncing"}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>)
}
