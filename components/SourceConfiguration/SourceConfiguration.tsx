'use client'
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import useDrivePicker from '@/packages/GoogleDrive';
import { DialogClose } from '@radix-ui/react-dialog';
import { Loader2, RefreshCcw, Settings2, X } from 'lucide-react';
import { EMPTY_FORM_STATE } from '@/lib/zodErrorHandle';
import { toast } from '@/hooks/use-toast';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { setConnectionConfig } from '@/actions/connections';
import { useTransition, useEffect } from "react";
import { FileProgress } from '@/events';


export default function SourceConfiguration({ accessToken, connection }: { accessToken: string | null | undefined, connection: ConnectionQuery }) {
  const [open, setOpen] = useState(false)
  const [isConfigSet, setIsConfigSet] = useState(connection.isConfigSet)
  const [openPicker] = useDrivePicker()
  const [pending, startTransition] = useTransition()
  const [isFinished, setIsFinished] = useState(false)
  const [directory, setDirectory] = useState<{ name: string, url: string }>({
    name: connection.folderName || "*",
    url: connection.directory || "root"
  });

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
  }, []);



  const handleSetConfig = (data: FormData) => {
    data.set("id", connection.id)
    data.set("folderName", directory.name)
    data.set("directory", directory.url)
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



  const showPicker = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'FOLDERS',
      setIncludeFolders: true,
      setSelectFolderEnabled: true,
      token: accessToken ?? undefined,
      supportDrives: true,
      callbackFunction: (data) => {
        console.log({ data })
        if (data.action === "loaded") {
          setOpen(false)
        }
        if (data.action === 'picked') {
          setDirectory({
            name: data.docs[0].name,
            url: data.docs[0].url
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
      <Button size='sm' disabled={!isFinished && connection.isSyncing} variant={isConfigSet ? 'ghost' : 'default'} onClick={() => setOpen(true)} >
        {!isFinished && connection.isSyncing && <RefreshCcw className='animate-spin' />}
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
                disabled={!isFinished && connection.isSyncing || connection.isConfigSet}
                onClick={showPicker} type='button'
                readOnly
              />
              <Button onClick={showPicker} type="button" disabled={!isFinished && connection.isSyncing || connection.isConfigSet}  >
                Select Folder
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Partition</label>
            <Input
              id='partition'
              name='partition'
              disabled={!isFinished && connection.isSyncing || connection.isConfigSet}
              placeholder="default"
              defaultValue={connection.partition}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <Textarea
              id='metadata'
              name='metadata'
              disabled={!isFinished && connection.isSyncing}
              placeholder='{"company": "dcup"}'
              defaultValue={connection.metadata || "{}"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Page Limit</label>
            <Input
              type="number"
              name='pageLimit'
              disabled={!isFinished && connection.isSyncing || connection.isConfigSet}
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
              disabled={!isFinished && connection.isSyncing || connection.isConfigSet}
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

