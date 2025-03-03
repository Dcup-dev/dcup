'use client'
import { useActionState, useEffect, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { SelectGroup, SelectValue } from '@radix-ui/react-select';
import useDrivePicker from '@/packages/GoogleDrive';
import { DialogClose } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { EMPTY_FORM_STATE } from '@/lib/zodErrorHandle';
import { setConnectionConfig } from '@/actions/connections/config';
import { ConnectionTable } from '@/db/schemas/connections';

export default function SourceConfiguration({ accessToken, currentConnection }: { accessToken: string | null | undefined, currentConnection: typeof ConnectionTable }) {
  const [directory, setDirectory] = useState<{ name: string, url: string }>();
  const [open, setOpen] = useState(false)
  const [isConfigSet, setIsConfigSet] = useState(!!currentConnection.directory)

  const [openPicker] = useDrivePicker()

  const [state, formAction] = useActionState(setConnectionConfig, EMPTY_FORM_STATE);


  useEffect(() => {
    if (state.status === 'SUCCESS') {
      setOpen(false)
      setIsConfigSet(true)
    }
  }, [state])


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
        if (data.action === 'picked') {
          setDirectory({
            name: data.docs[0].name,
            url: data.docs[0].url
          })
        }
        setOpen(true)
      },
    })
  };


  return (<Dialog open={open} onOpenChange={o => setOpen(o)} >
    <DialogTrigger asChild>
      <Button size="sm" variant={isConfigSet ? 'link' : 'default'} onClick={() => setOpen(true)} >Configure</Button>
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
      <form action={(data) => {
        data.set("folderName", directory?.name || "*")
        data.set("directory", directory?.url || "")
        formAction(data)
      }}>
        <div className="grid gap-4 py-4">
          <div>
            <label className="block text-sm font-medium">Folder</label>
            <div className="flex items-center gap-2">
              <Input
                value={directory?.name || currentConnection.folderName || ""}
                placeholder="No folder selected"
                onClick={showPicker} type='button'
                readOnly
              />
              <Button onClick={showPicker} type="button">
                Select Folder
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Partition</label>
            <Input
              id='partition'
              name='partition'
              placeholder="default"
              defaultValue={currentConnection.partition}

            />
          </div>
          <div>
            <label className="block text-sm font-medium">Import Mode</label>
            <Select name='importMode' defaultValue={currentConnection.importMode} >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Fast">Fast (Text Only)</SelectItem>
                  <SelectItem value="Hi-res">Hi-res (Text, Images, Tables)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <Textarea
              id='metadata'
              name='metadata'
              placeholder='{"company": "dcup"}'
              defaultValue={currentConnection.metadata || "{}"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Page Limit</label>
            <Input
              type="number"
              name='pageLimit'
              id='pageLimit'
              defaultValue={currentConnection.pagesCount !== 0 ? currentConnection.pagesCount : undefined}
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
              type="number"
              defaultValue={currentConnection.documentsCount !== 0 ? currentConnection.documentsCount : undefined}
              placeholder="Enter document limit"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of documents processed. The connection will pause once the limit is reached.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">{isConfigSet ? "Save changes" : "Set Configuration"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  );
}

