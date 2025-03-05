import { ConnectionTable } from '@/db/schemas/connections'
import { getOAuth2Client } from '@/lib/connectors/googleDrive';
import { drive } from '@googleapis/drive'
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
        fields: 'nextPageToken, files',
        pageSize: 1000,
        pageToken,
      });
      if (response.data.files) {
        allFiles.push(...response.data.files);
      }
      pageToken = response.data.nextPageToken;
    } while (pageToken);

    let text = "";
    let tables: unknown[] = []

    allFiles.map(async (f) => {
      switch (f.fileExtension) {
        case "pdf":
          // stream the file
          const pdf = await processPdf(f.webContentLink!) // to fix
          console.log(`found: ${pdf}`)
          text = pdf.text;
          tables = pdf.tables;
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
