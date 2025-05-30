import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { eq } from "drizzle-orm";
import { connectionConfig } from "../utils";

export const setGoogleDriveConnection = async (formData: FormData) => {
  const config = connectionConfig.safeParse({
    connectionId: formData.get("connectionId"),
    identifier: formData.get("identifier"),
    folderName: formData.get("folderName"),
    folderId: formData.get("folderId"),
    metadata: formData.get("metadata"),
    pageLimit: formData.get("pageLimit"),
    fileLimit: formData.get("fileLimit"),
  })

  if (!config.success) {
    const errors = config.error.errors
      .map(err => {
        const fieldPath = err.path.length > 0 ? err.path.join('.') : 'value'
        return `"${fieldPath}": ${err.message}`
      })
      .join('; ')
    throw new Error(`Validation errors - ${errors}`)
  }

  await databaseDrizzle.update(connections).set({
    identifier: config.data.identifier,
    folderName: config.data.folderName,
    connectionMetadata: config.data.folderId ? {
      folderId: config.data.folderId,
    } : undefined,
    metadata: config.data.metadata,
    limitPages: config.data.pageLimit,
    limitFiles: config.data.fileLimit,
    isConfigSet: true,
  }).where(eq(connections.id, config.data.connectionId))

  return {
    connectionId: config.data.connectionId,
    service: "GOOGLE_DRIVE",
    pageLimit: config.data.pageLimit,
    fileLimit: config.data.fileLimit,
    metadata: config.data.metadata,
    files: [],
    links: [],
    texts: []
  }
}
