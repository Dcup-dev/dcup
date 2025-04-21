import { NextResponse } from 'next/server';
import { Dropbox, DropboxAuth } from 'dropbox';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { tryAndCatch } from '@/lib/try-catch';
import { databaseDrizzle } from '@/db';
import { connections } from '@/db/schemas/connections';
import { shortId } from '@/lib/utils';

type DropboxResponse = {
  access_token: string,
  token_type: string,
  expires_in: number,
  refresh_token: string,
  id_token: string,
  scope: string,
  uid: string,
  account_id: string
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      return NextResponse.json(
        { code: 'Unauthorized', message: "Unauthorized Request" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const dbxAuth = new DropboxAuth({
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      fetch: fetch
    });


    const tokenRes = await tryAndCatch(dbxAuth.getAccessTokenFromCode(
      `${process.env.NEXTAUTH_URL}/api/connections/dropbox/callback`,
      code
    ));
    if (tokenRes.error) {
      return NextResponse.json(
        { code: 'token_exchange_failed', message: tokenRes.error.message },
        { status: 502 },
      );
    }
    const { result, status } = tokenRes.data!;
    const data = result as DropboxResponse

    if (status !== 200) {
      return NextResponse.json(
        { code: 'dropbox_oauth_failed', message: "Dropbox OAuth Error" },
        { status: tokenRes.data.status },
      );
    }

    dbxAuth.setAccessToken(data.access_token);
    if (data.refresh_token) {
      dbxAuth.setRefreshToken(data.refresh_token);
    }

    const dbx = new Dropbox({ auth: dbxAuth });
    const acctRes = await tryAndCatch(dbx.usersGetCurrentAccount());
    if (acctRes.error) {
      return NextResponse.json(
        { code: 'fetch_account_failed', message: acctRes.error.message },
        { status: 502 }
      );
    }

    const email = acctRes.data.result.email.split("@")[0]
    const upsertRes = await tryAndCatch(
      databaseDrizzle
        .insert(connections)
        .values({
          userId: session.user.id,
          identifier: email + shortId(10),
          service: 'DROPBOX',
          connectionMetadata: {
            folderId: ""
          },
          credentials: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          },
        })
        .onConflictDoUpdate({
          target: [connections.identifier],
          set: { identifier: email + shortId(10) },
        })
    );
    if (upsertRes.error) {
      return NextResponse.json(
        { code: 'db_upsert_failed', message: upsertRes.error.message },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL('/connections', request.url));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
  }
}
