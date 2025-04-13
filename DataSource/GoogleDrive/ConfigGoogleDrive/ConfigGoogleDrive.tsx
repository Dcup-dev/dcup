"use client"
import { useState } from 'react';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import useDrivePicker from '../GoogleDrivePicker';
import { ConfigConnection } from '@/components/ConfigConnection/ConfigConnection';

export const ConfigGoogleDrive = ({ connection, token, status }: { connection: ConnectionQuery, token: string | null | undefined, status: "PROCESSING" | "FINISHED" | undefined }) => {
  const [open, setOpen] = useState(false)
  const [openPicker] = useDrivePicker()
  const [directory, setDirectory] = useState<{ name: string, id: string | null }>({
    name: connection.folderName || "",
    id: null,
  });


  const showPicker = async () => {
    openPicker({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
      viewId: 'FOLDERS',
      setIncludeFolders: true,
      setSelectFolderEnabled: true,
      token: token ?? undefined,
      supportDrives: true,
      callbackFunction: (data) => {
        if (data.action === "loaded") {
          setOpen(false)
        }
        if (data.action === 'picked') {
          setDirectory({
            name: data.docs[0].name,
            id: data.docs[0].id
          })
          setOpen(true)
        }
        if (data.action === "cancel") {
          setOpen(true)
        }
      },
    })
  };
  return <ConfigConnection
    connection={connection}
    status={status}
    showPicker={showPicker}
    directory={directory}
    open={open}
    setOpen={setOpen}
  />
}
