"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { UploadFileForm } from "@/components/UploadFileForm/UploadFileForm"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export const SetNewConfigDirect = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Files</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Files Directly</DialogTitle>
        </DialogHeader>
        <UploadFileForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
};
