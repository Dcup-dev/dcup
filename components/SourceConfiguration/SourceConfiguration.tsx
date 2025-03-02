'use client'
import { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { SelectGroup, SelectValue } from '@radix-ui/react-select';
import useDrivePicker from '@/packages/GoogleDrive';
import { DialogClose } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
export default function SourceConfiguration({ accessToken }: { accessToken: string | null | undefined }) {

  const [folder, _] = useState<string>('');
  const [partition, setPartition] = useState<string>('default');
  const [importMode, setImportMode] = useState<string>('Fast');
  const [metadata, setMetadata] = useState<string>('{}');
  const [pageLimit, setPageLimit] = useState<number>(0);
  const [documentLimit, setDocumentLimit] = useState<number>(0);
  const [open, setOpen] = useState(false)


  const [openPicker] = useDrivePicker()


  const showPicker = () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'FOLDERS',
      setIncludeFolders: true,
      setSelectFolderEnabled: true,
      token: accessToken ?? undefined,
      showUploadView: false,
      showUploadFolders: false,
      supportDrives: true,
      multiselect: true,
      callbackFunction: (data) => {
        if (data.action === 'cancel') {
          console.log('User clicked cancel/close button')
        }
        console.log(data)
        setOpen(true)
      },
    })
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log({ folder, partition, importMode, metadata, pageLimit, documentLimit });
  };

  return (<Dialog open={open} onOpenChange={o => setOpen(o)} >
    <DialogTrigger asChild>
      <Button size="sm" onClick={() => setOpen(true)} >Configure</Button>
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
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div>
            <label className="block text-sm font-medium">Folder</label>
            <div className="flex items-center gap-2">
              <Input
                value={folder}
                placeholder="No folder selected"
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
              value={partition}
              onChange={(e) => setPartition(e.target.value)}
              placeholder="default"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Import Mode</label>
            <Select onValueChange={setImportMode}>
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
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"company": "dcup"}'
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Page Limit</label>
            <Input
              type="number"
              value={pageLimit || ""}
              onChange={(e) => setPageLimit(Number(e.target.value))}
              placeholder="Enter page limit"
            />
            <p className="text-xs text-muted-foreground">
              Setting a page limit will stop processing further pages until the limit is increased or removed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Document Limit</label>
            <Input
              type="number"
              value={documentLimit || ""}
              onChange={(e) => setDocumentLimit(Number(e.target.value))}
              placeholder="Enter document limit"
            />
            <p className="text-xs text-muted-foreground">
              Limit the number of documents processed. The connection will pause once the limit is reached.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
  );
}

