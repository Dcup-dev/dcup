import { databaseDrizzle } from '@/db';
import { connections } from '@/db/schemas/connections';
import { eq } from 'drizzle-orm';
import { Dropbox, DropboxAuth, files } from 'dropbox';
import { z } from 'zod'
import { FileContent } from '..';
import { processPdfBuffer } from '../Files/pdf';
import { publishProgress } from '@/events';

const dropboxCredentials = z.object({
  accessToken: z.string().min(5),
  refreshToken: z.string().min(5),
})
export const authDropbox = async () => {
  const oauth2Client = new DropboxAuth({
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
  })

  const authUrl = await oauth2Client.getAuthenticationUrl(
    `${process.env.NEXTAUTH_URL}/api/connections/dropbox/callback`,
    undefined,
    'code',
    'offline',
    ["files.metadata.read", "files.content.read", "email", "openid", "account_info.read"]
  ).then(authUrl => `${authUrl}&force_reapprove=true`);
  return authUrl.toString();
}

export const getDropboxAuthorization = async (credentials: unknown, connectionId: string) => {
  const { success, error, data: storedTokens } = dropboxCredentials.safeParse(credentials);

  if (!success) {
    const errors = error.errors
      .map(err => {
        const fieldPath = err.path.length > 0 ? err.path.join('.') : 'value'
        return `"${fieldPath}": ${err.message}`
      })
      .join('; ')
    throw new Error(`Validation errors - ${errors}`)
  }

  const { accessToken, refreshToken } = await refreshAccessToken(
    storedTokens.refreshToken,
    process.env.DROPBOX_CLIENT_ID!,
    process.env.DROPBOX_CLIENT_SECRET!)

  const oauth2Client = new DropboxAuth({
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    accessToken: accessToken,
    refreshToken: refreshToken,
    fetch: fetch,
  });

  oauth2Client.checkAndRefreshAccessToken();
  const newRefreshToken = oauth2Client.getRefreshToken()
  const newAccessToken = oauth2Client.getAccessToken()

  if (
    newAccessToken !== storedTokens.accessToken ||
    newRefreshToken !== storedTokens.refreshToken
  ) {
    oauth2Client.setAccessToken(newAccessToken)
    oauth2Client.setRefreshToken(newRefreshToken)
    await databaseDrizzle.update(connections)
      .set({
        credentials: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      })
      .where(eq(connections.id, connectionId));

  }
  return oauth2Client;
};

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ accessToken: string, refreshToken: string }> {
  const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}`,
  });

  if (!response.ok) throw new Error('Failed to refresh access token');
  const data = await response.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token || refreshToken };
}

export const readDropboxFiles = async (
  connectionId: string,
  metadata: string | null,
  connectionMetadata: unknown,
  credentials: unknown
): Promise<FileContent[]> => {
  const { folderId } = connectionMetadata as { folderId: string }
  try {
    const auth = await getDropboxAuthorization(credentials, connectionId);
    const dbx = new Dropbox({ auth, fetch });
    const allFiles: files.FileMetadataReference[] = [];

    const traverseFolder = async (path: string) => {
      let hasMore = true;
      let cursor: string | undefined;

      do {
        const response = cursor
          ? await dbx.filesListFolderContinue({ cursor })
          : await dbx.filesListFolder({ path, recursive: false });

        for (const entry of response.result.entries) {
          if (entry['.tag'] === 'folder') {
            await traverseFolder(entry.path_lower!);
          } else if (
            entry['.tag'] === 'file' &&
            entry.name.toLowerCase().endsWith('.pdf')
          ) {
            allFiles.push(entry as files.FileMetadataReference);
          }
        }

        hasMore = response.result.has_more;
        cursor = response.result.cursor;
      } while (hasMore);
    };

    await traverseFolder(folderId);
    const pdfFileProcessing: FileContent[] = [];
    for (const file of allFiles) {
      const response = await fetch('https://content.dropboxapi.com/2/files/download', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + auth.getAccessToken(),
          'Dropbox-API-Arg': JSON.stringify({ path: file.path_lower! }),
        },
      });

      const blob = await response.blob();
      const content = await processPdfBuffer(blob);
      const fileContent: FileContent = {
        name: file.name || "",
        pages: content,
        metadata: {
          ...JSON.parse(metadata || "{}"),
        }
      }
      pdfFileProcessing.push(fileContent)
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
    return [];
  }
};
