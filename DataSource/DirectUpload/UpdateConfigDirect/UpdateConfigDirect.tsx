"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@radix-ui/react-dialog';
import { Settings2, X } from 'lucide-react';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { UploadFileForm } from '@/components/UploadFileForm/UploadFileForm';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const UpdateConfigDirect = ({ connection, status }: { connection: ConnectionQuery, status: "PROCESSING" | "FINISHED" | undefined}) => {
  const [open, setOpen] = useState(false)

  return (<Dialog open={open} onOpenChange={setOpen} >
    <DialogTrigger asChild>
      <Button size='sm' variant={connection.isConfigSet ? 'ghost' : 'default'} disabled={status === 'PROCESSING' && connection.isSyncing} >
        <Settings2 />
        Configure
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogClose onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
      <DialogHeader>
        <DialogTitle>Source Configuration</DialogTitle>
        <DialogDescription>
          Configure your connection settings.
        </DialogDescription>
      </DialogHeader>
      <UploadFileForm setOpen={setOpen} connection={connection} />
    </DialogContent>
  </Dialog>
  );
}
