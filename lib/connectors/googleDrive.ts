import { auth } from "@googleapis/oauth2";


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

export async function getValidAccessToken(storedTokens: {
  accessToken: string;
  refreshToken: string;
  expiryDate: number
}) {
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

  // This call will refresh the token if needed.
  const res = await oauth2Client.getAccessToken()

  // If a new access token was fetched, update your database with res.token and res.res?.expiry_date
  return res.token;
}
