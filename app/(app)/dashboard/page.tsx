import { authOptions } from "@/auth";
import { DataInput } from "@/components/DataInput/DataInput";
import { FileProvider } from "@/context/FilesContext";
import { LinkProvider } from "@/context/LinksContext";
import { Code, Loader2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import dynamic from 'next/dynamic'

const JsonEditor = dynamic(() => import('@/components/JsonEditor/JsonEditor'), {
  loading: () => <Loader2 className="animate-spin" />
})

export default async function page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound()

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
        <FileProvider >
          <LinkProvider>
            <DataInput />
            <JsonEditor full={true} />
          </LinkProvider>
        </FileProvider>
      </div>
    </div>
  </div>)
}
