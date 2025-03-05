import { spawn } from "child_process"
import path from "path"

export interface PdfProcessResult {
  text: string;
  tables: unknown[]; // You can refine this type if needed.
}

export const processPdf = async (webContentLink: string): Promise<PdfProcessResult> => {
  return new Promise((resolve, reject) => {
    const python = path.join(process.cwd(), "scripts", "venv", "bin", "python3");
    const script = path.join(process.cwd(), "scripts", "process_pdf.py");

    const processChild = spawn(python, [script, webContentLink])

    let output = '';
    let errorOutput = '';
    console.log({ webContentLink })
    console.log({ python })
    console.log({ script })

    processChild.stdout.on('data', (data) => {
      console.log({ data: data.toString() })
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
        let result = JSON.parse(output);
        // Ensure result has the correct structure.
        if (result.error) {
          return new Error(result.error)
        }
        const processedResult: PdfProcessResult = {
          text: result.text || "",
          tables: result.tables || [],
        };
        return resolve(processedResult);
      } catch (err) {
        reject(err);
      }
    });
  });
}
