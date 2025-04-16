"use server"
import { authDropbox } from "@/fileProcessors/connectors/dropbox";
import { authGoogleDrive } from "@/fileProcessors/connectors/googleDrive";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { revalidatePath } from "next/cache";
import { S3Client, ListBucketsCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod'
import { tryAndCatch } from "@/lib/try-catch";
import { redirect } from 'next/navigation';
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { shortId } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

type FormState = {
  message: string;
};

export async function newConnection(_: FormState, formData: FormData) {
  const connection = formData.get("connection")
  let redirectUrl: string;

  try {
    switch (connection) {
      case "google-drive":
        redirectUrl = authGoogleDrive()
        break;
      case "dropbox":
        redirectUrl = await authDropbox()
        break;
      case "aws":
        redirectUrl = "/authorized/callback/aws"
        break;
      default:
        throw new Error("Unknown provider");
    }
    revalidatePath("/connections");
    return toFormState("SUCCESS", redirectUrl);
  } catch (e) {
    return fromErrorToFormState(e);
  }
}

const connectionSchema = z.object({
  accessKeyId: z.string().min(16, 'Invalid Access Key ID'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().min(1, 'Region is required'),
  endpoint: z.string().optional().nullable(),
});

export async function authorizeAWS(_: FormState, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error("forbidden");

    const validated = connectionSchema.safeParse({
      accessKeyId: formData.get('accessKeyId'),
      secretAccessKey: formData.get('secretKey'),
      region: formData.get('region'),
      endpoint: formData.get('endpoint'),
    });
    if (!validated.success) {
      throw new Error(validated.error.errors[0].message)
    }

    const s3Config = {
      credentials: {
        accessKeyId: validated.data.accessKeyId,
        secretAccessKey: validated.data.secretAccessKey,
      },
      region: validated.data.region,
      ...(validated.data.endpoint && { endpoint: validated.data.endpoint }),
    };

    const s3Client = new S3Client(s3Config);
    const allBackets = await s3Client.send(new ListBucketsCommand({}));
    const { error: objectError } = await tryAndCatch(s3Client.send(new GetObjectCommand({
      Bucket: allBackets.Buckets![0].Name!,
      Key: "__test_permissions_file__",
    })))
    if (objectError) {
      if (objectError.name !== "NoSuchKey") throw objectError
    }

    await databaseDrizzle
      .insert(connections)
      .values({
        userId: session.user.id!,
        identifier: shortId(15),
        service: 'AWS',
        connectionMetadata: {
          folderId: ""
        },
        credentials: {
          accessKeyId: validated.data.accessKeyId,
          secretAccessKey: validated.data.secretAccessKey,
          region: validated.data.region,
          endpoint: validated.data.endpoint,
        },
      })
      .onConflictDoUpdate({
        target: [connections.identifier],
        set: { identifier: shortId(16) },
      });
  } catch (e) {
    revalidatePath("/authorized/callback/aws");
    return fromErrorToFormState(e);
  }
  redirect("/connections")
}
