'use client'
import { Card,CardContent,CardDescription,CardFooter,CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "../ui/button"
import { Editor, useMonaco } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState, useTransition } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertCircleIcon, CheckCircle, Code, Code2, Copy, LockIcon, X } from "lucide-react"
import { FaMagic } from "react-icons/fa"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark, materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useFiles } from "@/hooks/use-file"
import { useLinks } from "@/hooks/use-link"
import { useToast } from "@/hooks/use-toast"
import { processDataProxy } from "@/actions/proxy"
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"

interface ProcessingTab {
  id: string;
  title: string;
  content: string;
}

const JsonEditor = ({ full }: { full: boolean }) => {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const editorRef = useRef<any | null>(null);
  const [tabs, setTabs] = useState<ProcessingTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [tabName, setTabName] = useState("schema")
  const { filesProvider } = useFiles()
  const { links } = useLinks()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition();
  const [errMess, setErrMess] = useState<null | string>(null)

  const [schema, setSchema] = useState(`{
    "customer_id": "string",
    "product": {
      "id": "number",
      "title": "string"
    }
}`);

  const [validation, setValidation] = useState({
    valid: true,
    message: "Valid JSON schema",
  });

  const handleProcessData = async () => {
    const formData = new FormData();

    formData.append("schema", typeof schema === "string" ? schema : JSON.stringify(schema));

    if (links.length === 0 && filesProvider.length === 0) {
      return toast({
        variant: "destructive",
        title: "No data provided",
        description: "Please upload a file or enter links to proceed.",
      });
    }

    if (links.length > 0 && filesProvider.length > 0) {
      return toast({
        variant: "destructive",
        title: "Cannot process links and files together",
        description: "Please remove either links or files and try again.",
      });
    }

    startTransition(async () => {
      try {
        if (links.length > 0) {
          links.forEach((link) => formData.append("links", link));
        } else {
          filesProvider.forEach((fp) => formData.append("files", fp.file));
        }
        const current = await processDataProxy(EMPTY_FORM_STATE, formData)

        if (current.status !== 'SUCCESS') {
          throw new Error(current.message)
        }

        // Add a new tab with the processed result
        const tabId = `tab-${Date.now()}`;
        const newTab = {
          id: tabId,
          title: `Result ${tabs.length + 1}`,
          content: current.message,
        };

        setTabs([...tabs, newTab]);
        setActiveTab(tabId);
        setTabName("data");

      } catch (error: any) {
        if (error.message === "Unauthorized") {
          setErrMess("Please log in to start processing your files.");
          return;
        }

        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: error.message || "An unexpected error occurred.",
        });
      }
    });
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(tab => tab.id !== tabId);
      if (activeTab === tabId) {
        setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
      return newTabs;
    });
  };

  const validateSchema = (value?: string) => {
    try {
      JSON.parse(value || schema);
      setValidation({
        valid: true,
        message: "Schema is valid and ready for processing",
      });
      setSchema(value || "");
    } catch (error) {
      setValidation({
        valid: false,
        message: error instanceof Error ? error.message : "Invalid JSON",
      });
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    monaco?.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
  };

  const handleFormatJson = () => {
    editorRef.current?.getAction("editor.action.formatDocument").run();
  };

  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
    }
  }, [theme, monaco]);

  return (<div className="flex-1 flex flex-col h-min-[500px]">
    {isPending && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <svg
              className="h-16 w-16 animate-spin text-primary"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray="80"
                strokeDashoffset="60"
                strokeLinecap="round"
              />
            </svg>
            <Code2 className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="text-lg font-semibold animate-pulse">
            Transforming your data...
          </p>
        </div>
      </div>
    )}
    <Tabs defaultValue="schema" value={tabName} onValueChange={setTabName} className="w-full h-full flex flex-col">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="schema" className="gap-2">
          <Code2 className="h-5 w-5" />
          Schema
        </TabsTrigger>
        <TabsTrigger value="data" className="gap-2" disabled={!full}>
          <FaMagic className="h-5 w-5" />
          Extracted Data
          {!full && <LockIcon className="h-5 w-5" />}
        </TabsTrigger>
      </TabsList>
      {/* File Upload Section */}
      <TabsContent value="schema" className="flex-1">
        <Card className="h-full flex flex-col">
          {errMess && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>{errMess}</AlertDescription>
            </Alert>
          )}
          <CardHeader>
            <CardTitle>Define Your Data Schema</CardTitle>
            <CardDescription>
              <p>
                Provide the schema that will structure your extracted data. Ensure
                your schema is valid to process the data seamlessly.
              </p>
              <div className="flex justify-between items-center">
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg ${validation.valid ? "text-green-700" : "text-red-700"
                    }`}
                >
                  {validation.valid ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  <span className="text-sm">{validation.message}</span>
                </div>
                <Button size="sm" onClick={handleFormatJson}>
                  Format
                </Button>
              </div>
            </CardDescription>

          </CardHeader>
          <CardContent className="space-y-2 h-full flex-grow">
            <Editor
              height="350px"
              defaultLanguage="json"
              value={schema}
              onMount={handleEditorDidMount}
              onChange={value => validateSchema(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              size="lg"
              disabled={!validation.valid || isPending || filesProvider.length === 0 && links.length === 0}
              onClick={handleProcessData}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            >
              <Code className="h-5 w-5 mr-2" />
              Process Data
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      {/* Links Input Section */}
      <TabsContent value="data" className="flex-1 xl:w-[866px] lg:w-[600px] md:w-[450px]">
        <Card className="h-[573px] flex flex-col">
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
            <CardDescription>
              For privacy reasons, your data will not be saved. Once you close this tab, all processed data will be permanently removed. Ensure you copy or save any necessary information before closing.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 h-full flex flex-col">
            {tabs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                No processed results yet
              </div>
            ) : (
              <Tabs
                value={activeTab || ""}
                className="h-full w-full flex flex-col"
                onValueChange={(value) => setActiveTab(value)}
              >
                <TabsList className="w-full rounded-none border-b bg-transparent p-0 flex justify-start overflow-x-auto overflow-y-hidden scrollbar-custom">
                  {tabs.map(tab => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative h-10 rounded-none border-r data-[state=active]:border-b-0 flex-shrink-0 bg-background hover:bg-muted/50 data-[state=active]:bg-background"
                      asChild
                    >
                      <div className="flex items-center px-2 py-2">
                        <span className="mr-2">{tab.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTab(tab.id);
                          }}
                          className="ml-2 rounded-full hover:bg-accent p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabs.map(tab => (
                  <TabsContent
                    key={tab.id}
                    value={tab.id}
                    className="m-0 flex-1 min-h-0 relative"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(tab.content)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <div className="p-4  md:h-[70%] h-[65%]">
                      <SyntaxHighlighter
                        language="json"
                        style={theme === "dark" ? materialDark : materialLight}
                        showLineNumbers
                        customStyle={{
                          backgroundColor: theme === "dark" ? "#1e1e1e" : "#f5f5f5",
                          borderRadius: "0.5rem",
                          padding: "1rem",
                          fontSize: "0.875rem",
                          maxHeight: "100%", // Ensures the viewer respects the container height
                          overflow: "auto", // Enables internal scrolling within the SyntaxHighlighter
                        }}
                        codeTagProps={{
                          style: {
                            backgroundColor: "transparent", // Override internal code background
                          },
                        }}
                      >
                        {JSON.stringify(JSON.parse(tab.content), null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>)
};

export default JsonEditor
