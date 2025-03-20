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

export const getFileContent = async (connection: ConnectionTable): Promise<FileContent[]> => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      return await readGoogleDriveFiles(connection.id, connection.connectionMetadata, connection.credentials)
    default:
      return []
  }
}
