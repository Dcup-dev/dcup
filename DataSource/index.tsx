import { ConnectionQuery } from '@/app/(protected)/connections/page'
import { SyncConnection } from '@/components/SyncConnection/SyncConnection';
import { DeleteConnection } from '@/components/DeleteConnection/DeleteConnection';
import { ConfigGoogleDrive } from './GoogleDrive/ConfigGoogleDrive/ConfigGoogleDrive';


export const DataSource = async ({ connection, token }: { connection: ConnectionQuery, token: string | undefined | null }) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <ConfigGoogleDrive connection={connection} token={token} />
        <DeleteConnection connection={connection} />
      </>
    case "DIRECT_UPLOAD":
      // todo: implement ConfigDirectUpload
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <DeleteConnection connection={connection} />
      </>
    default:
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} />}
        <DeleteConnection connection={connection} />
      </>
  }
}
