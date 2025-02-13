import * as motion from 'motion/react-client'
import { DataInput } from "@/components/DataInput/DataInput";
import { FileProvider } from "@/context/FilesContext";
import { LinkProvider } from "@/context/LinksContext";
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const JsonEditor = dynamic(() => import('@/components/JsonEditor/JsonEditor'), {
  loading: () => <Loader2 className="animate-spin" />
})

const DashboardSection = () => {
  return (
    <div className="w-full sm:p-6 py-20 md:px-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
          Try AI-Powered Data Extraction
        </h2>
        <p className="text-lg md:text-xl text-fd-muted-foreground max-w-3xl mx-auto">
          Upload documents or Input URLs and instantly convert them into structured JSON—fast, accurate, and AI-driven.
        </p>
      </motion.div>

      {/* Input and Editor */}
      <div className="flex flex-col lg:flex-row p-6 gap-6 w-full max-w-5xl mx-auto">
        <FileProvider>
          <LinkProvider>
            <DataInput />
            <div className="flex-1 min-w-0 ">
              <JsonEditor full={false} />
            </div>
          </LinkProvider>
        </FileProvider>
      </div>
    </div>
  );
};
export default DashboardSection;
