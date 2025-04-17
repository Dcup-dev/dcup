'use server'
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { GetObjectCommand, ListBucketsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { tryAndCatch } from "@/lib/try-catch";
import { redirect } from 'next/navigation';
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { shortId } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { z } from 'zod'

const awsConnectionSchema = z.object({
  accessKeyId: z.string().min(16, 'Invalid Access Key ID'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  region: z.string().min(1, 'Region is required'),
  endpoint: z.string().optional().nullable(),
});

type FormState = {
  message: string;
};

export async function authorizeAWS(_: FormState, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) throw new Error("forbidden");

    const validated = awsConnectionSchema.safeParse({
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
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    const { error: objectError } = await tryAndCatch(s3Client.send(new GetObjectCommand({
      Bucket: Buckets![0].Name!,
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

export async function loadBuckets(_: FormState, formData: FormData) {
  try {

    const { accessKeyId, secretAccessKey, region, endpoint } =
      awsConnectionSchema.parse(
        JSON.parse(formData.get("credentials")?.toString() || "{}")
      )

    const client = new S3Client({
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      region: region,
      endpoint: endpoint || undefined,
    });
    const { Buckets } = await client.send(new ListBucketsCommand({}))

    revalidatePath("/connections");
    return toFormState("SUCCESS", JSON.stringify(Buckets?.flatMap(b => b.Name!) || '[]') || "[]");
  } catch (e) {
    console.log(e)
    return fromErrorToFormState(e);
  }
}

export async function loadFolders(_: FormState, formData: FormData) {
  try {
    const { accessKeyId, secretAccessKey, region, endpoint } =
      awsConnectionSchema.parse(
        JSON.parse(formData.get("credentials")?.toString() || "{}")
      );
    const bucket = formData.get("bucket");
    const prefix = formData.get("prefix")?.toString() || '';

    if (!bucket) throw new Error("bucket name required");

    const client = new S3Client({
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      region: region,
      endpoint: endpoint || undefined,
    });

    const { CommonPrefixes } = await client.send(new ListObjectsV2Command({
      Bucket: bucket.toString(),
      Delimiter: '/',
      Prefix: prefix // Add prefix to the command
    }));

    const folders = CommonPrefixes?.flatMap(p => p.Prefix?.replace(prefix, '')) || [];
    return toFormState("SUCCESS", JSON.stringify(folders || '[]') || '[]');
  } catch (e) {
    return fromErrorToFormState(e);
  }
}
