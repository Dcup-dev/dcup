import { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogClose } from '@radix-ui/react-dialog';
import { Loader2, Settings2, X } from 'lucide-react';
import { EMPTY_FORM_STATE } from '@/lib/zodErrorHandle';
import { toast } from '@/hooks/use-toast';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { useTransition } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { setConnectionConfig } from '@/actions/connctions/set';
import { Label } from '@/components/ui/label';

type ConnectionProps = {
  connection: ConnectionQuery,
  status: "PROCESSING" | "FINISHED" | undefined,
  showPicker: () => void
  directory: { name: string, id: string | null }
  open: boolean,
  setOpen: Dispatch<SetStateAction<boolean>>

}
export const ConfigConnection = ({ connection, directory, status, open, setOpen, showPicker }: ConnectionProps) => {
  const [isConfigSet, setIsConfigSet] = useState(connection.isConfigSet)
  const [pending, startTransition] = useTransition()
  const isTest = process.env.NEXT_PUBLIC_APP_ENV === 'TEST'

  // Service-specific text configuration
  const serviceLabels = {
    AWS: {
      folderLabel: "S3 Location",
      selectButton: "Select Bucket & Folder",
      placeholder: "No bucket selected",
      error: "Please select an S3 bucket",
      helpText: "Select an S3 bucket and optional folder prefix"
    },
    default: {
      folderLabel: "Folder",
      selectButton: "Select Folder",
      placeholder: "No folder selected",
      error: "Please select a folder",
      helpText: ""
    }
  };
  const getServiceLabel = (key: keyof typeof serviceLabels['AWS']) =>
    connection.service === 'AWS' ? serviceLabels.AWS[key] : serviceLabels.default[key];

  const handleSetConfig = (data: FormData) => {
    data.set("connectionId", connection.id)
    data.set("service", connection.service)

    if (directory?.id) data.set("folderId", directory.id)
    if (isTest) {
      const folderName = data.get("folderName")
      data.set("folderId", folderName || "")
    } else {
      data.set("folderName", directory.name)
    }
    startTransition(async () => {
      const setConfig = async () => {
        try {
          if (connection.service === 'AWS' && !directory.id?.split("/")[0]) throw new Error(getServiceLabel('error'));
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


  return (<Dialog open={open} onOpenChange={o => setOpen(o)} >
    <DialogTrigger asChild>
      <Button data-test={`btn-config-${connection.identifier}`} size='sm' variant={isConfigSet ? 'ghost' : 'default'} disabled={status === 'PROCESSING' || (!status && connection.isSyncing)} onClick={() => setOpen(true)} >
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
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="identifier">Connection Name</Label>
            <Input
              id="identifier"
              name="identifier"
              defaultValue={connection ? connection.identifier : ""}
              placeholder="Unique connection name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Folder</label>
            <div className="flex items-center gap-2">
              <Input
                name='folderName'
                value={isTest ? undefined : directory?.name || connection.folderName || ""}
                placeholder={getServiceLabel('placeholder')}
                onClick={isTest ? undefined : showPicker}
                type={isTest ? 'text' : 'button'}
                readOnly={!isTest}
              />
              <Button onClick={showPicker} type="button" disabled={connection.isSyncing || connection.isConfigSet}  >
                {getServiceLabel('selectButton')}
              </Button>
            </div>
            {connection.service === 'AWS' && (
              <p className="text-xs text-muted-foreground mt-1">
                {serviceLabels.AWS.helpText}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Metadata (JSON)</label>
            <Textarea
              id='metadata'
              name='metadata'
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
              name='fileLimit'
              id='fileLimit'
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
          <Button disabled={pending} type="submit" data-test={`btn-config-connection`} >
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
