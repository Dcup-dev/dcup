"use client"
import { useState } from 'react';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { ConfigConnection } from '@/components/ConfigConnection/ConfigConnection';
import { useDropboxPicker } from './DropboxPicker/dropbox-picker.context';

export const ConfigDropbox = ({ connection, token, status }: { connection: ConnectionQuery, token: string | null | undefined, status: "PROCESSING" | "FINISHED" | undefined }) => {
  const [open, setOpen] = useState(false)
  const { openPicker, selectedDirectory } = useDropboxPicker();

  return <ConfigConnection
    connection={connection}
    status={status}
    showPicker={() => token && openPicker(token)}
    directory={selectedDirectory || { id: null, name: "*" }}
    open={open}
    setOpen={setOpen}
  />
}
