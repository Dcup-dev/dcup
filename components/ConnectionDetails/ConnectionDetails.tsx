"use client"
import { TableCell, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";
import { ConnectionQuery } from "@/app/(protected)/connections/page";
import { FileProgress } from "@/events";
import { getServiceIcon } from "@/lib/helepers";
import { Pickaxe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function ConnectionDetails({ connection, children }: { connection: ConnectionQuery, children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [progress, setProgress] = useState({
    connectionId: connection.id,
    processedPage: connection.files.reduce((sum, file) => sum + file.totalPages, 0),
    processedFile: connection.files.length,
    lastAsync: connection.lastSynced,
    isFinished: false
  });

  useEffect(() => {
    setIsMounted(true);
    const eventSource = new EventSource("/api/progress");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as FileProgress;
      if (data.connectionId === connection.id) setProgress(data)
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [connection.id]);

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
    {!progress.isFinished && connection.isSyncing && <TableCell>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Pickaxe className="animate-bounce" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Processing Files...</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TableCell>}
    <TableCell>
      {children}
    </TableCell>
  </TableRow>)
}
