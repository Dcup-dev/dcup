"use client"
import { FiCloud } from "react-icons/fi";
import { SiNotion, SiAwslambda, SiGmail, SiSlack, SiConfluence, SiGoogledrive } from "react-icons/si";
import { TableCell, TableRow } from "@/components/ui/table";
import { timeAgo } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";
import { ConnectionQuery } from "@/app/(protected)/connections/page";
import { FileProgress } from "@/events";

export default function ConnectionDetails({ connection, children }: { connection: ConnectionQuery, children: ReactNode }) {
  const [progress, setProgress] = useState({
    connectionId: connection.id,
    processedPage: connection.files.reduce((sum, file) => sum + file.totalPages, 0),
    processedFile: connection.files.length,
    lastAsync: connection.lastSynced,
  });

  useEffect(() => {
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
  }, []);

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
  return (<TableRow>
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
    <TableCell>{progress.processedFile}</TableCell>
    <TableCell>{progress.processedPage}</TableCell>
    <TableCell>
      {timeAgo(connection.createdAt)}
    </TableCell>
    <TableCell>
      {progress.lastAsync
        ? timeAgo(progress.lastAsync)
        : <span className="text-muted-foreground">Never</span>}
    </TableCell>
    <TableCell>
      {children}
    </TableCell>
  </TableRow>)
}
