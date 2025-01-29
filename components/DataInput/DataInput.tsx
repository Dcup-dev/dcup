"use client"
import { Button } from "@/components/ui/button"
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
import { Label } from "@/components/ui/label"
import { AlertCircle, Link, UploadCloud, XCircleIcon } from "lucide-react"
import { ChangeEvent, useRef, useState } from "react"
import { Textarea } from "../ui/textarea"
import { useFiles } from "@/hooks/use-file"
import { useLinks } from "@/hooks/use-link"


export const DataInput = () => {
  const inputFile = useRef<HTMLInputElement>(null);
  const { removeFiles, addFiles, filesProvider } = useFiles()
  const [invalidLinks, setInvalidLinks] = useState<string[]>([]);
  const { addLinks, links } = useLinks()

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const newFiles = Array.from(e.dataTransfer.files);
    newFiles.map((f, i) => addFiles({ file: f, id: `${f.name}:${i}` }))

  };

  const addNewFile = (e: ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    newFiles.map((f, i) => addFiles({ file: f, id: `${f.name}:${i}` }))
  }
  // URL validation regex (supports http/https URLs)
  const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;

  const validateLinks = (links: string[]) => {
    const invalid: string[] = [];
    links.forEach(link => {
      if (!URL_REGEX.test(link.trim())) {
        invalid.push(link);
      }
    });
    setInvalidLinks(invalid);
    return invalid.length === 0;
  };
  const addNewLinks = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const links = e.target.value.split('\n')
    const trimmedLinks = links
      .map(link => link.trim())
      .filter(link => link.length > 0);

    if (validateLinks(trimmedLinks)) {
      addLinks(trimmedLinks);
    }else{
      addLinks([])
    }
  };

  return (
    <div className="flex-1 flex flex-col h-min-[500px]">
      <Tabs defaultValue="file" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="gap-2">
            <UploadCloud className="h-5 w-5" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="link" className="gap-2">
            <Link className="h-5 w-5" />
            Links
          </TabsTrigger>
        </TabsList>
        {/* File Upload Section */}
        <TabsContent value="file" className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Upload your Files here</CardTitle>
              <CardDescription>Easily upload your documents to convert them into structured, AI-ready JSON. Supports PDFs, Word documents, PowerPoint presentations, Excel sheets and CSVs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 h-full flex-grow">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal-500 transition-colors h-full flex flex-col justify-center"
              >
                <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Drag & drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <input
                  type="file"
                  ref={inputFile}
                  multiple
                  onChange={addNewFile}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" asChild>
                  <Button size='lg' onClick={() => inputFile.current?.click()}>
                    Browse Files
                  </Button>
                </Label>

                {filesProvider.length > 0 && (
                  <div className="mt-6 text-left space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selected files:
                    </p>
                    {filesProvider.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <XCircleIcon
                          className="h-5 w-5 text-red-500 cursor-pointer"
                          onClick={() => removeFiles(file.id)}
                        />
                        {file.file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Links Input Section */}
        <TabsContent value="link" className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Provide File URLs</CardTitle>
              <CardDescription>Paste the URLs of your documents to instantly transform them into clean JSON. Supports HTTP/HTTPS links for PDFs, Word, Excel, and other formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 flex-grow">
              <div className="space-y-4">
                <Textarea
                  defaultValue={links.join("\n")}
                  onChange={addNewLinks}
                  placeholder="Enter URLs (one per line)"
                  className={`w-full h-80 resize-none ${invalidLinks.length > 0 ? 'border-2 border-red-500' : ''
                    }`}
                />
                {invalidLinks.length > 0 && (
                  <div className="mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 inline-block mr-1" />
                    Invalid URLs found ({invalidLinks.length}):
                    <ul className="list-disc list-inside mt-1">
                      {invalidLinks.slice(0, 3).map((link, index) => (
                        <li key={index} className="truncate">
                          {link || "Empty line"}
                        </li>
                      ))}
                      {invalidLinks.length > 3 && (
                        <li>...and {invalidLinks.length - 3} more</li>
                      )}
                    </ul>
                  </div>)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>)
}
