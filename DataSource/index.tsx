"use client"
import { ConnectionQuery } from '@/app/(protected)/connections/page'
import { SyncConnection } from '@/components/SyncConnection/SyncConnection';
import { DeleteConnection } from '@/components/DeleteConnection/DeleteConnection';
import { ConfigGoogleDrive } from './GoogleDrive/ConfigGoogleDrive/ConfigGoogleDrive';
import { UpdateConfigDirect } from './DirectUpload/UpdateConfigDirect/UpdateConfigDirect';
import { ConfigDropbox } from './Dropbox/ConfigDropbox';
import { DropboxPickerProvider } from './Dropbox/DropboxPicker/dropbox-picker.context';

export const DataSource = ({ connection, token, status }: { connection: ConnectionQuery, token: string | undefined | null, status: "PROCESSING" | "FINISHED" | undefined }) => {
  switch (connection.service) {
    case "GOOGLE_DRIVE":
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} status={status} />}
        <ConfigGoogleDrive connection={connection} token={token} status={status} />
        <DeleteConnection connection={connection} status={status} />
      </>
    case "DIRECT_UPLOAD":
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} status={status} />}
        <UpdateConfigDirect connection={connection} status={status} />
        <DeleteConnection connection={connection} status={status} />
      </>
    case 'DROPBOX':
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} status={status} />}
        <DropboxPickerProvider>
          <ConfigDropbox connection={connection} status={status} token={token} />
        </DropboxPickerProvider>
        <DeleteConnection connection={connection} status={status} />
      </>
    default:
      return <>
        {connection.isConfigSet && <SyncConnection connection={connection} status={status} />}
        <DeleteConnection connection={connection} status={status} />
      </>
  }
}
