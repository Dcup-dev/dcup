import { databaseDrizzle } from '@/db';
import { connections } from '@/db/schemas/connections';
import { DropboxAuth } from 'dropbox';
import { z } from 'zod'

const dropboxCredentials = z.object({
  accessToken: z.string().min(5),
  refreshToken: z.string().min(5),
  expiresIn: z.number(),
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
  )
  return authUrl.toString();
}

export const getDropboxAuthorization = async (credentials: unknown) => {
  const storedTokens = dropboxCredentials.parse(credentials)
  const oauth2Client = new DropboxAuth({
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,
    accessToken: storedTokens.accessToken,
    refreshToken: storedTokens.refreshToken,
    accessTokenExpiresAt: new Date(storedTokens.expiresIn),
    fetch: fetch
  })

  oauth2Client.checkAndRefreshAccessToken()
  oauth2Client.refreshAccessToken()
  const refresh_token = oauth2Client.getRefreshToken()
  const access_token = oauth2Client.getAccessToken()

  if (refresh_token !== storedTokens.refreshToken || access_token !== storedTokens.accessToken)
    databaseDrizzle.update(connections).set({
      credentials: {
        refreshToken: refresh_token ?? storedTokens.refreshToken,
        accessToken: access_token ?? storedTokens.accessToken,
      }
    })
  return oauth2Client
}
