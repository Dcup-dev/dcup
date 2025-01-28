"use client"
import { ReactNode, createContext, useCallback, useMemo, useState } from "react";

type FileProvided = {
  file: File,
  id: string
}

type FileContextType = {
  filesProvider: FileProvided[];
  addFiles: (file: FileProvided) => void;
  removeFiles: (fileId: string) => void;
};

export const FileContext = createContext<FileContextType | null>(null);

export const FileProvider = ({children}: {children:ReactNode}) => {
  const [filesProvider, setFiles] = useState<FileProvided[]>([]);

  const addFiles = useCallback((f: FileProvided) => {
    setFiles((prev)=> [...prev, f])
  }, [])

  const removeFiles = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])


  const contextValue = useMemo(
    () => ({
      filesProvider, addFiles, removeFiles
    }),
    [filesProvider],
  );

  return <FileContext.Provider value={contextValue}>
    {children}
  </FileContext.Provider>
}
