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

export function getOAuth2Client(storedTokens: {
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
  return oauth2Client
}
