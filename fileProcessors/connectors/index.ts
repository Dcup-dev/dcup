import { ConnectionTable } from "@/db/schemas/connections";
import { getGoogleDriveAuthorization, readGoogleDriveFiles } from "./googleDrive";
import { FileContent } from "..";


export const getConnectionToken = async (connection: ConnectionTable) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      const oauthClient = await getGoogleDriveAuthorization(connection.credentials)
      const { token } = await oauthClient.getAccessToken()
      return token;
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
