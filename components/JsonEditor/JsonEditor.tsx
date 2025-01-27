'use client'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "../ui/button"
import { Editor, useMonaco } from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"
import { AlertCircle, CheckCircle, Code } from "lucide-react"

export const JsonEditor = () => {
  const { theme } = useTheme();
  const monaco = useMonaco();
  const editorRef = useRef<any | null>(null);

  const [schema, setSchema] = useState(`{
  "data_type": "object",
  "properties": {
    "name": { "type": "string" },
    "price": { "type": "number" }
  }
}`);
  const [validation, setValidation] = useState({
    valid: true,
    message: "Valid JSON schema",
  });

  const handleProcessData = () => {
    console.log("Processed Data:", schema);
  };

  const validateSchema = (value?: string) => {
    try {
      JSON.parse(value || schema);
      setValidation({
        valid: true,
        message: "Schema is valid and ready for processing",
      });
      setSchema(value || "")
    } catch (error) {
      setValidation({
        valid: false,
        message: error instanceof Error ? error.message : "Invalid JSON",
      });
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    if (monaco) {
      // Set the initial theme based on the current app theme
      monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
    }

  };

  const handleFormatJson = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  };

  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "vs-light");
    }
  }, [theme, monaco]);

  return (
    <div className="flex-1 flex flex-col h-[600px]">
      <Card className="h-full flex flex-col">
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
              <Button size="sm" onClick={handleFormatJson} disabled={!validation.valid}>
                Format
              </Button>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <Editor
            height="350px"
            defaultLanguage="json"
            value={schema}
            onMount={handleEditorDidMount}
            onChange={(value) => validateSchema(value)}
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
            disabled={!validation.valid}
            onClick={handleProcessData}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Code className="h-5 w-5" />
            Process Data
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
