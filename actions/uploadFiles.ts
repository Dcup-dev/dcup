"use server"
import { authOptions } from "@/auth";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { directUploadMetadata } from "@/fileProcessors/connectors/directUpload";
import { fromErrorToFormState, toFormState } from "@/lib/zodErrorHandle";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";



const s3 = new S3Client({
  region: process.env.S3_REGIN!,
  credentials: {
    accessKeyId: process.env.IAM_KEY!,
    secretAccessKey: process.env.IAM_SECRET!,
  },
});

const allowedFiles = z.object({
  files: z.array(z.any().refine((file) => {
    return (
      file ||
      (file instanceof File && file.type === "application/pdf")
    );
  },
    {
      message: "Invalid File",
    })
  ),
  links: z.array(z.string().min(5)),
  uploadName: z.string().min(1, { message: "Upload Name is required" }),
})

type FormState = {
  message: string;
};

export async function directUploading(_: FormState, formData: FormData) {
  const session = await getServerSession(authOptions)
  try {
    if (!session?.user?.id) throw new Error("forbidden");
    const { files, uploadName, links } = allowedFiles.parse({
      files: formData.getAll("files"),
      links: formData.getAll("links"),
      uploadName: formData.get("uploadName")
    })

    if (files.length === 0 && links.length === 0) {
      throw new Error("no file or links privateded")
    }
    const filesUrl = await setFilesInBucket(files, session.user.id!)

    await databaseDrizzle.insert(connections).values({
      userId: session.user.id!,
      identifier: uploadName,
      service: 'DIRECT_UPLOAD',
      connectionMetadata: {
        filesUrl: filesUrl,
        links: links
      },
    })

    revalidatePath("/connections");
    return toFormState("SUCCESS", "file process");
  } catch (e) {
    return fromErrorToFormState(e);
  }

}
async function setFilesInBucket(files: File[], userId: string) {
  const signedUrls = [];
  for (const file of files) {
    const signedUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.S3_NAME!,
        ContentType: file.type,
        ContentLength: file.size,
        Key: `${file.name}-${userId}`,
        Metadata: {
          userId: userId,
        },
      }),
      {
        expiresIn: 60,
      },
    );

    fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "content-type": file.type,
      },
    });
    signedUrls.push({ name: file.name, url: signedUrl.split("?")[0] });
  }
  return signedUrls
}

export async function deleteFilesInBucket(userId: string, connectionMetadata: unknown) {
  const { filesUrl } = directUploadMetadata.parse(connectionMetadata);
  const deleteObjectsCommand = new DeleteObjectsCommand({
    Bucket: process.env.S3_NAME!,
    Delete: { Objects: filesUrl.map((f) => ({ Key: `${f.name}-${userId}` })) },
  });
  return await s3.send(deleteObjectsCommand);
}
