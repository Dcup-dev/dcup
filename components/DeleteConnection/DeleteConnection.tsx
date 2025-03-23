"use client"
import { Button } from "../ui/button"
import { Loader2, Trash } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { toast } from "@/hooks/use-toast"
import { deleteConnectionConfig } from "@/actions/connections"
import { ConnectionQuery } from "@/app/(protected)/connections/page"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileProgress } from "@/events"

export const DeleteConnection = ({ connection }: { connection: ConnectionQuery }) => {
  const [open, setOpen] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [isPending, startTransition] = useTransition();

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

  const handleDeleteConnection = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("id", connection.id)
        formData.set("service", connection.service)
        formData.set("metadata", JSON.stringify(connection.connectionMetadata))
        const res = await deleteConnectionConfig(EMPTY_FORM_STATE, formData)
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

  return (
    <Dialog open={open} onOpenChange={e => setOpen(e)} >
      <DialogTrigger asChild>
        <DialogTrigger asChild>
          <Button size='sm' variant={'ghost'} disabled={!isFinished && connection.isSyncing} >
            <Trash />
            Delete
          </Button>
        </DialogTrigger>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete this connection
            and remove all configuration
          </DialogDescription>
        </DialogHeader>
        <DialogFooter >
          <Button type="submit" variant='destructive' onClick={handleDeleteConnection} disabled={isPending} >
            {isPending && <Loader2 className="animate-spin" />}
            Delete Connection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
