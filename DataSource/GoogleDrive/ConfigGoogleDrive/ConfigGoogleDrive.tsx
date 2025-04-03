"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose } from '@radix-ui/react-dialog';
import { Loader2, Settings2, X } from 'lucide-react';
import { EMPTY_FORM_STATE } from '@/lib/zodErrorHandle';
import { toast } from '@/hooks/use-toast';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { useTransition } from "react";
import useDrivePicker from '../GoogleDrivePicker';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { setConnectionConfig } from '@/actions/connctions/new';

export const ConfigGoogleDrive = ({ connection, token }: { connection: ConnectionQuery, token: string | null | undefined }) => {
  const [open, setOpen] = useState(false)
  const [isConfigSet, setIsConfigSet] = useState(connection.isConfigSet)
  const [openPicker] = useDrivePicker()
  const [pending, startTransition] = useTransition()
  const [directory, setDirectory] = useState<{ name: string, id: string | null }>({
    name: connection.folderName || "",
    id: null,
  });
 
  const handleSetConfig = (data: FormData) => {
    data.set("id", connection.id)
    data.set("folderName", directory.name)
    data.set("service", connection.service)
    directory?.id && data.set("folderId", directory.id)
    startTransition(async () => {
      const setConfig = async () => {
        try {
          const res = await setConnectionConfig(EMPTY_FORM_STATE, data)
          if (res.status === 'SUCCESS') {
            setOpen(false)
            setIsConfigSet(true)
          }
          if (res.message) {
            toast({
              title: res.message,
            });
          }
          if (res.status === 'ERROR') {
            throw new Error(res.message)
          }
        } catch (err: any) {
          toast({
            title: err.message,
            variant: 'destructive'
          });
        }
        return;
      };
      await setConfig();
    })
  }



  const showPicker = async () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'FOLDERS',
      setIncludeFolders: true,
      setSelectFolderEnabled: true,
      token: token ?? undefined,
      supportDrives: true,
      callbackFunction: (data) => {
        if (data.action === "loaded") {
          setOpen(false)
        }
        if (data.action === 'picked') {
          setDirectory({
            name: data.docs[0].name,
            id: data.docs[0].id
          })
          setOpen(true)
        }
        if (data.action === "cancel") {
          setOpen(true)
        }
      },
    })
  };


  return (<Dialog open={open} onOpenChange={o => setOpen(o)} >
    <DialogTrigger asChild>
      <Button size='sm' variant={isConfigSet ? 'ghost' : 'default'} onClick={() => setOpen(true)} >
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
      <form action={handleSetConfig}>
        <div className="grid gap-4 py-4">
          <div>
            <label className="block text-sm font-medium">Folder</label>
            <div className="flex items-center gap-2">
              <Input
                value={directory?.name || connection.folderName || ""}
                placeholder="No folder selected"
                disabled={connection.isSyncing || connection.isConfigSet}
                onClick={showPicker} type='button'
                readOnly
              />
              <Button onClick={showPicker} type="button" disabled={connection.isSyncing || connection.isConfigSet}  >
                Select Folder
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Partition</label>
            <Input
              id='partition'
              name='partition'
              disabled={connection.isSyncing || connection.isConfigSet}
              placeholder="default"
              defaultValue={connection.partition}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <Textarea
              id='metadata'
              name='metadata'
              disabled={connection.isSyncing}
              placeholder='{"company": "dcup"}'
              defaultValue={connection.metadata || "{}"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Page Limit</label>
            <Input
              type="number"
              name='pageLimit'
              disabled={connection.isSyncing || connection.isConfigSet}
              id='pageLimit'
              defaultValue={connection.files.reduce((s, f) => s + f.totalPages, 0) !== 0 ? connection.files.reduce((s, f) => s + f.totalPages, 0) : undefined}
              placeholder="Enter page limit"
            />
            <p className="text-xs text-muted-foreground">
              Setting a page limit will stop processing further pages until the limit is increased or removed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Document Limit</label>
            <Input
              name='documentLimit'
              id='documentLimit'
              disabled={connection.isSyncing || connection.isConfigSet}
              type="number"
              defaultValue={connection.files.length !== 0 ? connection.files.length : undefined}
              placeholder="Enter document limit"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of documents processed. The connection will pause once the limit is reached.
            </p>
          </div>

        </div>
        <DialogFooter>
          <Button disabled={pending} type="submit">
            {pending ? (
              <>
                {" "}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : isConfigSet ? "Save Changes" : "Set Configuration"
            }
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  );
}
