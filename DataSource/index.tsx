import { ConnectionQuery } from '@/app/(protected)/connections/page'
import { SyncConnection } from '@/components/SyncConnection/SyncConnection';
import { DeleteConnection } from '@/components/DeleteConnection/DeleteConnection';
import { ConfigGoogleDrive } from './GoogleDrive/ConfigGoogleDrive/ConfigGoogleDrive';
import { setGoogleDriveConnection } from './GoogleDrive/setGoogleDriveConnection';
import { setDirectUploadConnection, updateDirectUploadConnection } from './DirectUpload/setDirectUploadConnection';
import { TQueue } from '@/workers/queues/jobs/processFiles.job';
import { UpdateConfigDirect } from './DirectUpload/UpdateConfigDirect/UpdateConfigDirect';

export const DataSource = async ({ connection, token }: { connection: ConnectionQuery, token: string | undefined | null }) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <ConfigGoogleDrive connection={connection} token={token} />
        <DeleteConnection connection={connection} />
      </>
    case "DIRECT_UPLOAD":
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <UpdateConfigDirect connection={connection} />
        <DeleteConnection connection={connection} />
      </>
    default:
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <DeleteConnection connection={connection} />
      </>
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
