"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { FolderSync, Loader2 } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "@/hooks/use-toast"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { syncConnectionConfig } from "@/actions/connections"
import { ConnectionQuery } from "@/app/(protected)/connections/page"
import { FileProgress } from "@/events"

export const SyncConnection = ({ connection }: { connection: ConnectionQuery }) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition();
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const eventSource = new EventSource("/api/progress");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as FileProgress;
      if (data.connectionId === connection.id) setIsFinished(data.isFinished)
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [connection.id]);


  const handleSyncConnection = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", connection.id)
        formData.set("pageLimit", connection.files.reduce((s, f) => s + f.totalPages, 0).toString())
        formData.set("fileLimit", connection.files.length.toString())
        const res = await syncConnectionConfig(EMPTY_FORM_STATE, formData)
        if (res.status !== 'SUCCESS') {
          throw new Error(res.message)
        }
        setOpen(false)
        toast({
          title: res.message,
        });

      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "An unexpected error occurred.",
        });
      }
    })
  }

  return (<Dialog open={open} onOpenChange={e => setOpen(e)} >
    <DialogTrigger asChild>
      <DialogTrigger asChild>
        <Button size='sm' variant={'ghost'} disabled={connection.isSyncing} >
          {connection.isSyncing && <Loader2 className="animate-spin" />}
          <FolderSync />
          Sync
        </Button>
      </DialogTrigger>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Sync Now</DialogTitle>
        <DialogDescription>
          This will sync recent updates from your connected sources 🌟
        </DialogDescription>
      </DialogHeader>
      <DialogFooter >
        <Button type="submit" onClick={handleSyncConnection} disabled={isPending} >
          Sync Now
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
