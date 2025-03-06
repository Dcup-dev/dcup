import { ConnectionTable } from '@/db/schemas/connections'
import { getOAuth2Client } from '@/lib/connectors/googleDrive';
import { drive } from '@googleapis/drive'
import { Readable } from 'stream';
import { processPdf } from '../Files/pdf';

export const processGoogleDriveFiles = async (connection: typeof ConnectionTable) => {
  const folderId = connection.directory && extractFolderId(connection.directory) || "root";
  const oauth = getOAuth2Client({
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    expiryDate: Number(connection.expiryDate),
  })
  const storage = drive({ version: 'v3', auth: oauth })

  const allFiles = [];
  let pageToken: any;

  try {
    do {
      const response = await storage.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, fileExtension)',
        pageSize: 1000,
        pageToken,
      });
      if (response.data.files) {
        allFiles.push(...response.data.files);
      }
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    allFiles.map(async (f) => {
      switch (f.fileExtension) {
        case "pdf":
          // stream the file
          const res = await storage.files.get({
            fileId: f.id!,
            alt: "media",
          },
            { responseType: 'stream' }
          );
          const buf = await streamToBuffer(res.data);
          const pdfResult = await processPdf(buf);
          // todo: process pdf contact
          console.log(`Processed PDF result:`, pdfResult);
          break;
        default:
          break;
      }
    })
  } catch (error) {
    console.error('Error fetching files:', error);
  }
}

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
