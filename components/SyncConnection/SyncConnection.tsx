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
import { useState } from "react"

export const SyncConnection = () => {
  const [open, setOpen] = useState(false)

  return (<Dialog open={open} onOpenChange={e => setOpen(e)} >
    <DialogTrigger asChild>
      <DialogTrigger asChild>
        <Button size='sm' variant={'ghost'} >
          <FolderSync />
          Sync
        </Button>
      </DialogTrigger>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Sync Now</DialogTitle>
        <DialogDescription>
          Description ...
        </DialogDescription>
      </DialogHeader>
      <DialogFooter >
        <form>
          <Button type="submit" >Sync Now</Button>
        </form>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  )
}
