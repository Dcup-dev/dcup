"use client"
import { useState } from 'react';
import { ConnectionQuery } from '@/app/(protected)/connections/page';
import { ConfigConnection } from '@/components/ConfigConnection/ConfigConnection';
import { S3PickerDialog } from './AwsPicker';

export const ConfigAws = ({ connection, status }: {
  connection: ConnectionQuery,
  token: string | null | undefined,
  status: "PROCESSING" | "FINISHED" | undefined
}) => {
  const [open, setOpen] = useState(false);
  const [openPicker, setOpenPicker] = useState(false)
  const [directory, setDirectory] = useState<{ name: string, id: string | null }>({
    name: connection.folderName || "",
    id: null,
  });


  return (
    <>
      <ConfigConnection
        connection={connection}
        status={status}
        showPicker={() => setOpenPicker(curr => !curr)}
        directory={directory}
        open={open}
        setOpen={setOpen}
      />

      <S3PickerDialog
        credentials={connection.credentials}
        isOpen={openPicker}
        setOpen={setOpenPicker}
        initialBucket={""}
        onSelect={({ bucket, prefix }) => {
          setDirectory({
            name: prefix ? `${bucket}/${prefix}` : bucket,
            id: prefix ? `${bucket}/${prefix}` : bucket
          });
        }}
      />
    </>
  );
};
