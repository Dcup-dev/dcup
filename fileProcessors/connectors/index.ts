import { ConnectionTable } from "@/db/schemas/connections";
import { getGoogleDriveAuthorization, readGoogleDriveFiles } from "./googleDrive";
import { FileContent } from "..";
import { TQueue } from "@/workers/queues/jobs/processFiles.job";
import { setGoogleDriveConnection } from "@/DataSource/GoogleDrive/setGoogleDriveConnection";
import { setDirectUploadConnection, updateDirectUploadConnection } from "@/DataSource/DirectUpload/setDirectUploadConnection";
import { getDropboxAuthorization, readDropboxFiles } from "./dropbox";
import { setDropboxConnection } from "@/DataSource/Dropbox/setDropboxConnection";
import { setAWSConnection } from "@/DataSource/Aws/setAwsConnection";
import { readAWSFiles } from "./aws";
import { databaseDrizzle } from "@/db";
import { calculateRemainingPages, Plans } from "@/lib/Plans";
import { shortId } from "@/lib/utils";

export const getConnectionToken = async (connection: ConnectionTable) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      const oauthClient = await getGoogleDriveAuthorization(connection.credentials, connection.id)
      const { token } = await oauthClient.getAccessToken()
      return token;
    case "DROPBOX":
      const oauthDropbox = await getDropboxAuthorization(connection.credentials, connection.id)
      return oauthDropbox.getAccessToken()
    case "DIRECT_UPLOAD":
      return "DIRECT_UPLOAD"
    case "AWS":
      return "AWS"
    default:
      break;
  }
}

export const getFileContent = async ({ service, id, metadata, connectionMetadata, credentials }: ConnectionTable): Promise<FileContent[]> => {
  switch (service) {
    case "GOOGLE_DRIVE":
      return await readGoogleDriveFiles(id, metadata, connectionMetadata, credentials)
    case "DROPBOX":
      return await readDropboxFiles(id, metadata, connectionMetadata, credentials)
    case "AWS":
      return await readAWSFiles(id, metadata, connectionMetadata, credentials)
    default:
      return []
  }
}

export const setConnectionToProcess = async (formData: FormData): Promise<TQueue> => {
  const userId = formData.get("userId")!
  const service = formData.get("service")
  const connectionId = formData.get("connectionId")

  const user = await databaseDrizzle.query.users.findFirst({
    where: (u, ops) => ops.eq(u.id, userId.toString()),
    columns: {
      plan: true,
      email: true,
    },
    with: {
      connections: {
        columns: {
          id: true,
          limitPages: true,
        },
        with: {
          files: {
            columns: {
              totalPages: true,
            }
          }
        }
      }
    }
  })
  if (!user) throw new Error("no such account")
  const plan = Plans[user.plan]
  if (service !== "DIRECT_UPLOAD" && service !== "DIRECT_UPLOAD_UPDATE") {
    const used = user.connections.length;
    if (used >= plan.connections) {
      throw new Error(
        `You’ve reached your connection limit for the ${user.plan.toLowerCase()} plan (` +
        `${used}/${plan.connections}). ` +
        `To add more connections, please upgrade your subscription.`
      );
    }
  }

  const pageLimit = formData.get("pageLimit")
  if (!pageLimit) {
    const connection = user.connections.find(conn => conn.id === connectionId)
    if (connection && connection.limitPages) formData.set("pageLimit", connection.limitPages.toString())
  }

  const remainingPages = calculateRemainingPages(plan, user.connections,
    connectionId?.toString(),
    pageLimit?.toString())

  if (isFinite(remainingPages)) {
    formData.set("pageLimit", remainingPages.toString())
  }
  if (!formData.get("identifier")) {
    const email = user.email?.split('@')[0] ?? 'unknown';
    formData.set("identifier", email + shortId())
  }

  switch (formData.get("service")) {
    case "GOOGLE_DRIVE":
      return await setGoogleDriveConnection(formData)
    case "DIRECT_UPLOAD":
      return await setDirectUploadConnection(formData)
    case "DROPBOX":
      return await setDropboxConnection(formData)
    case "DIRECT_UPLOAD_UPDATE":
      return await updateDirectUploadConnection(formData)
    case "AWS":
      return await setAWSConnection(formData)
    default:
      throw new Error("service not supported")
  }
}
