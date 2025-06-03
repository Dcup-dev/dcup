import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { auth } from "@googleapis/oauth2";
import { z } from "zod"
import { FileContent, PageContent } from "..";
import { drive, drive_v3 } from "@googleapis/drive";
import { Readable } from "stream";
import { publishProgress } from "@/events";
import { processPdfBuffer } from "../Files/pdf";
import { eq } from "drizzle-orm";
import { processDirectText } from "../Files/text";

const googleDriveCredentials = z.object({
  accessToken: z.string().min(5),
  refreshToken: z.string().min(5),
  expiryDate: z.number(),
})

const googleDriveMetadata = z.object({
  folderId: z.string().min(2),
})

export const authGoogleDrive = () => {
  const oauth2Client = new auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  return authUrl
}

export const getGoogleDriveAuthorization = async (credentials: unknown, connectionId: string) => {
  const storedTokens = googleDriveCredentials.parse(credentials)
  const oauth2Client = new auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
  );

  oauth2Client.setCredentials({
    access_token: storedTokens.accessToken,
    refresh_token: storedTokens.refreshToken,
    expiry_date: storedTokens.expiryDate
  });
  oauth2Client.on('tokens', (tokens) => {
    const { refresh_token, access_token, expiry_date } = tokens
    if (refresh_token !== storedTokens.refreshToken || access_token !== storedTokens.accessToken || expiry_date !== storedTokens.expiryDate)

      databaseDrizzle.update(connections).set({
        credentials: {
          refreshToken: refresh_token ?? storedTokens.refreshToken,
          accessToken: access_token ?? storedTokens.accessToken,
          expiryDate: expiry_date ?? storedTokens.expiryDate,
        }
      }).where(eq(connections.id, connectionId))
  })
  return oauth2Client
}

export const readGoogleDriveFiles = async (
  connectionId: string,
  metadata: string | null,
  connectionMetadata: unknown,
  credentials: unknown
): Promise<FileContent[]> => {
  const { folderId } = googleDriveMetadata.parse(connectionMetadata);
  const oauth = await getGoogleDriveAuthorization(credentials, connectionId);
  const storage = drive({ version: 'v3', auth: oauth });

  const pdfFileProcessing: FileContent[] = [];

  // Recursively traverse folders to collect all PDF files
  const traverseFolder = async (parentFolderId: string) => {
    let pageToken: string | undefined;
    do {
      const response = await storage.files.list({
        q: `'${parentFolderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, fileExtension, mimeType)',
        pageSize: 1000,
        pageToken,
      });

      const filesInFolder = response.data.files || [];

      for (const file of filesInFolder) {
        if (file.mimeType === 'application/vnd.google-apps.folder' && file.id) {
          await traverseFolder(file.id);
        } else if (file.id) {
          try {
            if (file.fileExtension === 'pdf') {
              const fileContent = await processBuffer(storage, metadata ?? "{}", file, processPdfBuffer)
              pdfFileProcessing.push(fileContent);
            }
            if (file.fileExtension === 'txt' || file.mimeType === 'text/plain') {
              const fileContent = await processBuffer(storage, metadata ?? "{}", file, processTextBuffer)
              pdfFileProcessing.push(fileContent);
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
  };

  try {
    await traverseFolder(folderId);
    return pdfFileProcessing;
  } catch (error: any) {
    await publishProgress({
      connectionId: connectionId,
      processedFile: 0,
      processedPage: 0,
      errorMessage: error.data,
      lastAsync: new Date(),
      status: 'FINISHED'
    });
    return [];
  }
};

async function processTextBuffer(blob: Blob) {
  const text = await blob.text();
  return processDirectText(text)
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

async function processBuffer(
  storage: drive_v3.Drive,
  metadata: string,
  file: drive_v3.Schema$File,
  processor: (blob: Blob) => Promise<PageContent[]>
) {
  const res = await storage.files.get({
    fileId: file.id!,
    alt: "media",
  }, { responseType: 'stream' });

  const blob = await streamToBlob(res.data);
  const content = await processor(blob);

  const fileContent: FileContent = {
    name: file.name || "",
    pages: content,
    metadata: {
      ...(JSON.parse(metadata || "{}"))
    }
  };
  return fileContent;
}

async function streamToBlob(stream: Readable): Promise<Blob> {
  const buffer = await streamToBuffer(stream);  // Convert stream to buffer
  return new Blob([buffer]);  // Convert buffer to Blob
}
