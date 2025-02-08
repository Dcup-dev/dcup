'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TerminalIcon, LinkIcon, FileIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const ApiShowcase = () => {
  const fileExample = `const apiKey = 'YOUR_API_KEY';
const formData = new FormData();
formData.append('files', documentFile);
formData.append('schema', requiredSchema);

fetch('https://api.dcup.dev/v1/clean/file', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`
  },
  body: formData
})`;

  const urlExample = `const apiKey = 'YOUR_API_KEY';
const url = \`https://api.dcup.dev/v1/clean?url=https://example.com&url=https://otherside.com\`;

const formData = new FormData();
formData.append('schema', requiredSchema);

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${apiKey}\`
  },
  body: formData
})`;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Developer-First API Integration
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Clean, well-documented endpoints that make integration a breeze
          </p>
        </motion.div>

        <Tabs defaultValue="files" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 h-14 p-1">
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-gray-700/50 data-[state=active]:text-white h-full gap-2"
            >
              <FileIcon className="h-5 w-5" />
              File Cleaning
            </TabsTrigger>
            <TabsTrigger
              value="urls"
              className="data-[state=active]:bg-gray-700/50 data-[state=active]:text-white h-full gap-2"
            >
              <LinkIcon className="h-5 w-5" />
              URL Cleaning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card className="bg-gray-800/50 border-gray-700 p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 border-r border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <TerminalIcon className="h-6 w-6 text-blue-400" />
                      <h3 className="text-xl font-semibold text-white">File Cleaning API</h3>
                    </div>
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        background: 'transparent',
                        padding: 0,
                        fontSize: '0.875rem'
                      }}
                    >
                      {fileExample}
                    </SyntaxHighlighter>
                  </div>
                  <div className="md:w-1/3 p-6 bg-gray-900/20">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5 text-gray-400" />
                        <h4 className="text-white font-medium">Features</h4>
                      </div>
                      <ul className="space-y-3 text-gray-300">
                        <li>• Multi-file upload support</li>
                        <li>• 100+ file formats</li>
                        <li>• 5MB per file limit</li>
                        <li>• Batch processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="urls">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <Card className="bg-gray-800/50 border-gray-700 p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6 border-r border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                      <TerminalIcon className="h-6 w-6 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">URL Cleaning API</h3>
                    </div>
                    <SyntaxHighlighter
                      language="javascript"
                      style={vscDarkPlus}
                      customStyle={{
                        background: 'transparent',
                        padding: 0,
                        fontSize: '0.875rem'
                      }}
                    >
                      {urlExample}
                    </SyntaxHighlighter>
                  </div>
                  <div className="md:w-1/3 p-6 bg-gray-900/20">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                        <h4 className="text-white font-medium">Features</h4>
                      </div>
                      <ul className="space-y-3 text-gray-300">
                        <li>• Multiple URL processing</li>
                        <li>• Auto-format detection</li>
                        <li>• Public/private URL support</li>
                        <li>• Cached responses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="mt-12 grid md:grid-cols-3 gap-6 text-center"
        >
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-blue-400 mb-2">15+</div>
            <div className="text-gray-300">Supported Formats</div>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-green-400 mb-2">99.9%</div>
            <div className="text-gray-300">Uptime SLA</div>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-purple-400 mb-2">5ms</div>
            <div className="text-gray-300">Median Response Time</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ApiShowcase;
