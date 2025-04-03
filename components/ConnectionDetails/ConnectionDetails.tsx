"use client"
import { TableCell, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";
import { ConnectionQuery } from "@/app/(protected)/connections/page";
import { FileProgress } from "@/events";
import { getServiceIcon } from "@/lib/helepers";
import { Check, Clock, Pickaxe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useConnectionContext } from "@/context/connectionContext";

export default function ConnectionDetails({ connection, children }: { connection: ConnectionQuery, children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const { addConnection, removeConnection, queuedConnections } = useConnectionContext()
  const [status, setStatus] = useState<'active' | 'queued' | 'inactive'>('inactive')
  const [progress, setProgress] = useState({
    connectionId: connection.id,
    processedPage: connection.files.reduce((sum, file) => sum + file.totalPages, 0),
    processedFile: connection.files.length,
    lastAsync: connection.lastSynced,
    isFinished: false
  });

  useEffect(() => {
    setIsMounted(true);
    if (!connection.isSyncing) return

    let eventSource: EventSource | null = null

    const connect = () => {
      if (addConnection(connection.id)) {
        eventSource = new EventSource(`/api/progress?id=${connection.id}`)
        setStatus('active')

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data) as FileProgress
          setProgress(data)
          if (data.isFinished) {
            eventSource?.close()
            removeConnection(connection.id)
          }
        }

        eventSource.onerror = () => {
          eventSource?.close()
          removeConnection(connection.id)
          setStatus('inactive')
        }
      } else {
        setStatus('queued')
      }
    }

    connect()

    return () => {
      eventSource?.close()
      removeConnection(connection.id)
    }
  }, [connection.isSyncing, connection.id])

  useEffect(() => {
    if (queuedConnections.includes(connection.id)) {
      setStatus('inactive')
    }
  }, [queuedConnections])

  // Render status based on current state
  return (<TableRow>
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
    <TableCell>{progress.processedFile}</TableCell>
    <TableCell>{progress.processedPage}</TableCell>
    <TableCell>
      {isMounted ? timeAgo(connection.createdAt) : "Loading..."}
    </TableCell>
    <TableCell>
      {!isMounted ? "Loading..." : progress.lastAsync
        ? timeAgo(progress.lastAsync)
        : <span className="text-muted-foreground">Never</span>}
    </TableCell>
    <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            {progress.isFinished ? (
              <Check className="text-green-500" />
            ) : status === 'active' ? (
              <Pickaxe className="animate-bounce text-blue-500" />
            ) : status === 'queued' ? (
              <Clock className="text-yellow-500" />
            ) : (
              <Check className="text-muted-foreground" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            {progress.isFinished
              ? "Sync completed"
              : status === 'active'
                ? "Currently syncing"
                : status === 'queued'
                  ? `Queued position`
                  : "Sync not started"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>
    <TableCell>
      {children}
    </TableCell>
  </TableRow>)
}
