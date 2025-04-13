import { ConnectionTable } from "@/db/schemas/connections";
import { getGoogleDriveAuthorization, readGoogleDriveFiles } from "./googleDrive";
import { FileContent } from "..";
import { TQueue } from "@/workers/queues/jobs/processFiles.job";
import { setGoogleDriveConnection } from "@/DataSource/GoogleDrive/setGoogleDriveConnection";
import { setDirectUploadConnection, updateDirectUploadConnection } from "@/DataSource/DirectUpload/setDirectUploadConnection";
import { getDropboxAuthorization } from "./dropbox";

export const getConnectionToken = async (connection: ConnectionTable) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      const oauthClient = await getGoogleDriveAuthorization(connection.credentials)
      const { token } = await oauthClient.getAccessToken()
      return token;
    case "DROPBOX":
      const oauthDropbox = await getDropboxAuthorization(connection.credentials)
      return oauthDropbox.getAccessToken()
    case "DIRECT_UPLOAD":
      return "DIRECT_UPLOAD"
    default:
      break;
  }
}

export const getFileContent = async ({ service, id, metadata, connectionMetadata, credentials }: ConnectionTable): Promise<FileContent[]> => {
  switch (service) {
    case "GOOGLE_DRIVE":
      return await readGoogleDriveFiles(id, metadata, connectionMetadata, credentials)
    default:
      return []
  }
}

export const setConnectionToProcess = async (formData: FormData): Promise<TQueue> => {
  switch (formData.get("service")) {
    case "GOOGLE_DRIVE":
      return await setGoogleDriveConnection(formData)
    case "DIRECT_UPLOAD":
      return await setDirectUploadConnection(formData)
    case "DIRECT_UPLOAD_UPDATE":
      return await updateDirectUploadConnection(formData)
    default:
      throw new Error("service not supported")
  }
}
