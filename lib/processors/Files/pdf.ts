import { PageContent } from "@/lib/workers/queues/jobs/processFiles.job";
import { spawn } from "child_process"
import path from "path"

export const processPdf = async (fileContent: Buffer): Promise<PageContent[]> => {
  return new Promise((resolve, reject) => {
    const python = path.join(process.cwd(), "scripts", "venv", "bin", "python3");
    const script = path.join(process.cwd(), "scripts", "process_pdf.py");

    const processChild = spawn(python, [script]);

    let output = '';
    let errorOutput = '';

    processChild.stdout.on('data', (data) => {
      output += data.toString();
    });

    processChild.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    processChild.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
      }
      try {
        const result = JSON.parse(output);
        if (result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });

    // Send the Buffer data to Python process
    processChild.stdin.write(fileContent);
    processChild.stdin.end(); // Close the stdin stream
  });
};
