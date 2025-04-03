import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { auth } from "@googleapis/oauth2";
import { z } from "zod"
import { FileContent } from "..";
import { drive, drive_v3 } from "@googleapis/drive";
import { Readable } from "stream";
import { publishProgress } from "@/events";
import { processPdfBuffer } from "../Files/pdf";

const googleDriveCredentials = z.object({
  accessToken: z.string().min(5),
  refreshToken: z.string().min(5),
  expiryDate: z.number(),
})

const googleDriveMetadata = z.object({
  folderId: z.string().min(5),
})

export const authGoogleDrive = () => {
  const oauth2Client = new auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  return authUrl
}

export const getGoogleDriveAuthorization = async (credentials: unknown) => {
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
      })
  })
  return oauth2Client
}

export const readGoogleDriveFiles = async (connectionId: string, metadata: string | null, connectionMetadata: unknown, credentials: unknown): Promise<FileContent[]> => {
  const { folderId } = googleDriveMetadata.parse(connectionMetadata)
  const oauth = await getGoogleDriveAuthorization(credentials)
  const storage = drive({ version: 'v3', auth: oauth });

  const allFiles: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;

  try {
    do {
      const response = await storage.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, fileExtension, linkShareMetadata)',
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
        const content = await processPdfBuffer(buf);
        const fileContent: FileContent = {
          name: file.name || "",
          pages: content,
          metadata: {
            ...file.imageMediaMetadata,
            ...file.videoMediaMetadata,
            ...JSON.parse(metadata || "{}"),
          }
        }
        pdfFileProcessing.push(fileContent)
      }
    }
    return pdfFileProcessing

  } catch (error: any) {
    await publishProgress({
      connectionId: connectionId,
      fileName: "",
      processedFile: 0,
      processedPage: 0,
      errorMessage: error.data,
      lastAsync: new Date(),
      isFinished: true,
    })
    return [];
  }
};

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
