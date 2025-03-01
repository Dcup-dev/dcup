import { auth } from "@googleapis/oauth2";


export const authGoogleDrive = () => {
  const oauth2Client = new auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
  );

  const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  return authUrl
}
