import { ConnectionTable } from '@/db/schemas/connections'
import { getOAuth2Client } from '@/lib/connectors/googleDrive';
import { drive, drive_v3 } from '@googleapis/drive'
import { Readable } from 'stream';
import { processPdf } from '../Files/pdf';
import { FileContent } from '@/lib/workers/queues/jobs/processFiles.job';

export const processGoogleDriveFiles = async (connection: typeof ConnectionTable): Promise<FileContent[]> => {
  const folderId = connection.directory ? extractFolderId(connection.directory) : "root";
  const oauth = getOAuth2Client({
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    expiryDate: Number(connection.expiryDate),
  });
  const storage = drive({ version: 'v3', auth: oauth });

  const allFiles: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await storage.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, fileExtension, linkShareMetadata, videoMediaMetadata, imageMediaMetadata)',
        pageSize: 1000,
        pageToken,
      });
      if (response.data.files) {
        allFiles.push(...response.data.files);
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    const pdfFileProcessing: FileContent[] = []

    // Process PDF files concurrently.
    for (let file of allFiles) {
      if (file.fileExtension === 'pdf' && file.id) {
        const res = await storage.files.get({
          fileId: file.id,
          alt: "media",
        }, { responseType: 'stream' });
        const buf = await streamToBuffer(res.data);
        const content = await processPdf(buf);
        const fileContent: FileContent = {
          name: file.name || "",
          pages: content,
          metadata: {
            ...file.imageMediaMetadata,
            ...file.videoMediaMetadata,
          }
        }
        pdfFileProcessing.push(fileContent)
      }
    }
    return pdfFileProcessing

  } catch (error) {
    // todo: send notification
    console.error('Error fetching files:', error);
    return [];
  }
};

export function extractFolderId(folderUrl: string): string | null {
  const regex = /\/folders\/([^/?]+)/;
  const match = folderUrl.match(regex);
  return match ? match[1] : null;
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
