import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { drive } from '@googleapis/drive'
import { auth } from '@googleapis/oauth2'
import { databaseDrizzle } from "@/db";

const oauth2Client = new auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/connections/google-drive/callback'
);

export default async function page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound()

  const connections = await databaseDrizzle.query.connections.findMany({
    where: (c, ops) => ops.eq(c.userId, session.user.id!)
  })

  const googleAuth = connections.find(c => c.service === 'GOOGLE_DRIVE')!

  oauth2Client.setCredentials({
    access_token: googleAuth.accessToken,
    refresh_token: googleAuth.refreshToken,
    expiry_date: Number(googleAuth.expiryDate),

  })
  const d = drive({ version: 'v2', auth: oauth2Client })
  const res = await d.files.list()
  
  return (<div className="w-full sm:p-6">TODO: {res.data.etag?.toString()} </div>)
}
