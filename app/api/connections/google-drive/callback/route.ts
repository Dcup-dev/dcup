import { NextResponse } from 'next/server';
import { auth, oauth2 } from '@googleapis/oauth2';
import { databaseDrizzle } from '@/db';
import { connections } from '@/db/schemas/connections';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

const oauth2Client = new auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  // Exchange the authorization code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const auth = oauth2('v2')
  const { data } = await auth.userinfo.get({ auth: oauth2Client })

  await databaseDrizzle.insert(connections).values({
    userId: session.user.id!,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    email: data.email!,
    service: 'GOOGLE_DRIVE',
    expiryDate: tokens.expiry_date?.toString() || new Date().toString()
  })
  return NextResponse.redirect(new URL('/connections', request.url));
}
