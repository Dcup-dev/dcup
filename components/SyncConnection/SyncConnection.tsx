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
import { FolderSync } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "@/hooks/use-toast"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { ConnectionQuery } from "@/app/(protected)/connections/page"
import { syncConnectionConfig } from "@/actions/connctions/sync"

export const SyncConnection = ({ connection }: { connection: ConnectionQuery }) => {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition();

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
        <Button size='sm' variant={'ghost'}  >
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
