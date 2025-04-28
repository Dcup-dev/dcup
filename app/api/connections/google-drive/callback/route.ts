import { NextResponse } from 'next/server';
import { auth, oauth2 } from '@googleapis/oauth2';
import { databaseDrizzle } from '@/db';
import { connections } from '@/db/schemas/connections';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { shortId } from '@/lib/utils';
import { tryAndCatch } from '@/lib/try-catch';

const oauth2Client = new auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
);

export async function GET(request: Request) {
  try {
    const sessRes = await tryAndCatch(getServerSession(authOptions));
    if (sessRes.error) {
      return NextResponse.json(
        { code: 'Unauthorized', message: sessRes.error.message },
        { status: 500 },
      );
    }

    const session = sessRes.data;
    if (!session?.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const tokenRes = await tryAndCatch(oauth2Client.getToken(code));
    if (tokenRes.error) {
      return NextResponse.json(
        { code: 'token_exchange_failed', message: tokenRes.error.message },
        { status: 502 },
      );
    }
    const { tokens } = tokenRes.data!;
    oauth2Client.setCredentials(tokens);

    const auth = oauth2('v2');
    const userInfoRes = await tryAndCatch(
      auth.userinfo.get({ auth: oauth2Client }),
    );
    if (userInfoRes.error) {
      return NextResponse.json(
        { code: 'userinfo_failed', message: userInfoRes.error.message },
        { status: 502 },
      );
    }
    const data = userInfoRes.data!.data;
    const email = data.email?.split('@')[0] ?? 'unknown';
    const upsertRes = await tryAndCatch(
      databaseDrizzle
        .insert(connections)
        .values({
          userId: session.user.id!,
          identifier: email + shortId(),
          service: 'GOOGLE_DRIVE',
          connectionMetadata: {
            folderId: "root"
          },
          credentials: {
            expiryDate: tokens.expiry_date!,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token!,
          }
        })
        .onConflictDoUpdate({
          target: [connections.identifier],
          set: { identifier: email + shortId(10) },
        }),
    );
    if (upsertRes.error) {
      return NextResponse.json(
        { code: 'db_upsert_failed', message: upsertRes.error.message },
        { status: 500 },
      );
    }
   return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/connections`);
  } catch (error: any) {
    return NextResponse.json(
      { code: "internal_server_error", message: error.message },
      { status: 500 },
    );
  }
}
