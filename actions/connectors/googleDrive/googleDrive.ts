"use server";
import { authOptions } from "@/auth";
import { fromErrorToFormState } from "@/lib/zodErrorHandle";
import { getServerSession } from "next-auth";
import { auth } from '@googleapis/oauth2';
import { redirect } from 'next/navigation'


const oauth2Client = new auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "/api/connection/"
);



export async function generateApiKey() {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) throw new Error("forbidden");

    const scopes = ['https://www.googleapis.com/auth/drive.readonly'];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
    });
    redirect(url)


    // await databaseDrizzle.insert(apiKeys).values({
    //   userId: session.user.id,
    //   name: parse.name,
    //   generatedTime: new Date(),
    //   apiKey: hashedKey,
    // });

  } catch (e) {
    return fromErrorToFormState(e);
  }
}
