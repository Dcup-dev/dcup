import { DataInput } from "@/components/DataInput/DataInput";
import { JsonEditor } from "@/components/JsonEditor/JsonEditor";
import { Code } from "lucide-react";

export default function page() {
  return (<div className="w-full sm:p-6">
    <div className="rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Code className="h-6 w-6 text-primary" />
          Data Extraction Studio
        </h1>
      </div>
     <div className="flex flex-col md:flex-row p-6 gap-6 flex-1">
        <DataInput />
        <JsonEditor />
      </div>
    </div>
  </div>)
}
