import { publishProgress } from "@/events";
import { FileContent } from "..";
import { GetObjectCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { processPdfBuffer } from "../Files/pdf";
import { Readable } from "stream";
import { NodeJsClient } from "@smithy/types";


export const readAWSFiles = async (
  connectionId: string,
  metadata: string | null,
  connectionMetadata: unknown,
  credentials: unknown
): Promise<FileContent[]> => {
  const { folderId } = connectionMetadata as { folderId: string }
  const { accessKeyId, secretAccessKey, region, endpoint } = credentials as { accessKeyId: string, secretAccessKey: string, region: string, endpoint?: string | null };

  try {
    const s3Client = new S3Client({
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      },
      region: region,
      endpoint: endpoint || undefined,
    }) as NodeJsClient<S3Client>;

    const [bucket, ...prefix] = folderId.split("/")

    const allPdfFiles: string[] = [];
    let continuationToken: string | undefined;

    // 1. List all PDF files recursively
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix.join("/"),
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(listCommand);

      response.Contents?.forEach((object) => {
        if (object.Key?.toLowerCase().endsWith('.pdf')) {
          allPdfFiles.push(object.Key);
        }
      });
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // 2. Process files
    const pdfFileProcessing: FileContent[] = [];

    for (const fileKey of allPdfFiles) {
      // Get the file
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: fileKey,
      });

      const response = await s3Client.send(getCommand);
      if (!response.Body) continue;
      const buffer = await streamToBuffer(response.Body)
      const content = await processPdfBuffer(buffer);
      const fileName = fileKey.split('/').pop() || fileKey;

      pdfFileProcessing.push({
        name: fileName,
        pages: content,
        metadata: {
          ...JSON.parse(metadata || "{}"),
          s3Location: `s3://${bucket}/${fileKey}`
        }
      });
    }
    return pdfFileProcessing;

  } catch (error: any) {
    await publishProgress({
      connectionId: connectionId,
      processedFile: 0,
      processedPage: 0,
      errorMessage: error.data,
      lastAsync: new Date(),
      status: 'FINISHED'
    })
  }
  return [];
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}
