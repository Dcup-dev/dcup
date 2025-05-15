import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Link, Loader2, UploadCloud, XCircleIcon } from "lucide-react"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { setConnectionConfig } from "@/actions/connctions/set"
import { ChangeEvent, Dispatch, SetStateAction, useMemo, useRef, useState, useTransition } from "react"
import { ConnectionQuery } from "@/app/(protected)/connections/page"

type TFileForm = {
  setOpen: Dispatch<SetStateAction<boolean>>;
  connection?: ConnectionQuery;
};

export const UploadFileForm = ({ setOpen, connection }: TFileForm) => {
  const [links, setLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [removedFiles, setRemovedFiles] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const handleUploadFiles = async (data: FormData) => {
    links.forEach((link) => data.append("links", link));
    files.forEach((file) => data.append("files", file));
    startTransition(async () => {
      try {
        if (connection) {
          data.set("service", "DIRECT_UPLOAD_UPDATE");
          data.set("connectionId", connection.id)
          removedFiles.forEach((fileName) => data.append("removedFiles", fileName));
        } else {
          data.set("service", "DIRECT_UPLOAD");
        }
        const res = await setConnectionConfig(EMPTY_FORM_STATE, data)
        if (res.status === "SUCCESS") {
          setLinks([]);
          setFiles([]);
          setRemovedFiles([]); // Reset removedFiles on success
          setOpen(false);
        }
        if (res.message) {
          toast({ title: res.message });
        }
        if (res.status === "ERROR") {
          throw new Error(res.message);
        }
      } catch (err: any) {
        toast({
          title: err.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form action={handleUploadFiles}>
      <div className="grid w-full max-w-sm items-center gap-1.5 pb-2">
        <Label htmlFor="identifier">Upload Name</Label>
        <Input
          id="identifier"
          name="identifier"
          defaultValue={connection ? connection.identifier : ""}
          placeholder="Unique upload name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Metadata (JSON)</label>
        <Textarea
          id="metadata"
          name="metadata"
          placeholder='{"company": "dcup"}'
          defaultValue={connection?.metadata ?? ""}
          className="max-h-10"
        />
      </div>

      <div className="py-3">
        <label className="block text-sm font-medium">Page Limit</label>
        <Input
          type="number"
          name="pageLimit"
          id="pageLimit"
          placeholder="Enter page limit"
          disabled={!!connection}
          defaultValue={connection ? connection.files.reduce((sum, file) => sum + file.totalPages, 0) : ""}
        />
      </div>

      <div className="py-2">
        <DataInput
          files={files}
          setFiles={setFiles}
          links={links}
          setLinks={setLinks}
          currentFiles={connection ? connection.files.map(f => f.name) : []}
          removedFiles={removedFiles}
          setRemovedFiles={setRemovedFiles}
        />
      </div>

      <DialogFooter>
        <Button disabled={pending} type="submit" data-test="btn-upload" >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};


type TDataInput = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  links: string[];
  setLinks: Dispatch<SetStateAction<string[]>>;
  currentFiles: string[];
  removedFiles: string[];
  setRemovedFiles: Dispatch<SetStateAction<string[]>>;
};

export const DataInput = ({ files, setFiles, links, setLinks, currentFiles, removedFiles, setRemovedFiles }: TDataInput) => {
  const inputFile = useRef<HTMLInputElement>(null);
  const [invalidLinks, setInvalidLinks] = useState<string[]>([]);
  const [invalidFile, setInvalidFile] = useState("");

  // Compute allFiles dynamically using useMemo
  const allFiles = useMemo(() => {
    const existingFiles = currentFiles.filter(fileName => !removedFiles.includes(fileName));
    const newFileNames = files.map(f => f.name);
    return [...existingFiles, ...newFileNames];
  }, [currentFiles, removedFiles, files]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter((f) => {
      if (f.type !== "application/pdf") {
        setInvalidFile(f.name);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const addNewFile = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter((f) => {
      if (f.type !== "application/pdf") {
        setInvalidFile(f.name);
        return false;
      }
      return true;
    });
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFiles = (fileName: string) => {
    if (currentFiles.includes(fileName)) {
      // If it's an existing file, add to removedFiles
      setRemovedFiles((prev) => [...prev, fileName]);
    } else {
      // If it's a new file, remove from files
      setFiles((curr) => curr.filter((f) => f.name !== fileName));
    }
    if (invalidFile === fileName) setInvalidFile("");
  };

  const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;

  const validateLinks = (newLinks: string[]) => {
    const invalid: string[] = [];
    const validLinks = newLinks.filter((link) => {
      const isValid = URL_REGEX.test(link.trim());
      if (!isValid) invalid.push(link);
      return isValid;
    });
    setInvalidLinks(invalid);
    setLinks(validLinks);
  };

  const addNewLinks = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newLinks = e.target.value.split("\n").map((link) => link.trim()).filter((link) => link);
    validateLinks(newLinks);
  };

  const env = process.env.NEXT_PUBLIC_APP_ENV;

  return (
    <div className="flex-1 flex flex-col h-full">
      <Tabs defaultValue="file" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="gap-2">
            <UploadCloud className="h-5 w-5" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="link" className="gap-2">
            <Link className="h-5 w-5" />
            Paste Links
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="flex-1">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Upload your PDFs</CardTitle>
              <CardDescription>Only PDF files are supported.</CardDescription>
              {invalidFile && (
                <div className="mt-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 inline-block mr-1" />
                  {`${invalidFile} is not supported. Please upload PDFs only.`}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-teal-500 transition-colors flex flex-col justify-center"
              >
                <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop PDF files here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <input
                  type="file"
                  name="fileUpload"
                  ref={inputFile}
                  multiple
                  accept="application/pdf"
                  onChange={addNewFile}
                  className={env === 'TEST' ? "block" : "hidden"}
                  id="file-upload"
                />
                <Label htmlFor="file-upload" asChild>
                  <Button size="lg" type="button" onClick={() => inputFile.current?.click()}>
                    Browse Files
                  </Button>
                </Label>

                {allFiles.length > 0 && (
                  <div className="mt-6 text-left space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected files:</p>
                    {allFiles.map(fileName => (
                      <div key={fileName} className="flex items-center gap-2 text-sm text-gray-600">
                        <XCircleIcon
                          data-test={`btn-remove-${fileName}`}
                          className="h-5 w-5 text-red-500 cursor-pointer"
                          onClick={() => removeFiles(fileName)}
                        />
                        {fileName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="link" className="flex-1">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Provide PDF URLs</CardTitle>
              <CardDescription>Enter valid HTTP/HTTPS links to PDF files.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  defaultValue={links.join("\n")}
                  onChange={addNewLinks}
                  placeholder="Enter URLs (one per line)"
                  className={`w-full h-60 resize-none ${invalidLinks.length > 0 ? "border-2 border-red-500" : ""}`}
                />
                {invalidLinks.length > 0 && (
                  <div className="mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    {invalidLinks.length} invalid URL{invalidLinks.length > 1 ? "s" : ""} detected:
                    <ul className="list-disc list-inside mt-1">
                      {invalidLinks.slice(0, 3).map((link, index) => (
                        <li key={index} className="truncate">{link || "Empty line"}</li>
                      ))}
                      {invalidLinks.length > 3 && (
                        <li>...and {invalidLinks.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
