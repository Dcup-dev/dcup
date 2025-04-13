"use client"
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DropboxPickerDialog } from './dropbox-picker-dialog';

type DropboxFolder = {
  id: string;
  name: string;
  path_display: string;
  '.tag': 'folder';
};

type DropboxPickerContextType = {
  isOpen: boolean;
  currentPath: string;
  folders: DropboxFolder[];
  loading: boolean;
  selectedFolder: DropboxFolder | null;
  pathHistory: string[];
  openPicker: (token: string) => void;
  closePicker: () => void;
  handleBack: () => void;
  handleFolderSelect: (folder: DropboxFolder) => void;
  handleFolderNavigate: (folder: DropboxFolder) => void;
    selectedDirectory: { name: string; id: string } | null;
  setSelectedDirectory: (dir: { name: string; id: string } | null) => void;
};

const DropboxPickerContext = createContext<DropboxPickerContextType | null>(null);

export function DropboxPickerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [folders, setFolders] = useState<DropboxFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DropboxFolder | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [selectedDirectory, setSelectedDirectory] = useState<{ 
  name: string; 
  id: string 
} | null>(null);

  const fetchFolders = async (path: string) => {
    const url = cursor
      ? 'https://api.dropboxapi.com/2/files/list_folder/continue'
      : 'https://api.dropboxapi.com/2/files/list_folder';

    const body = cursor ? { cursor } : {
      path: path,
      recursive: false,
      include_media_info: false,
      include_deleted: false,
      include_has_explicit_shared_members: false
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  };

  const loadFolders = async (path: string = '') => {
    setLoading(true);
    try {
      const data = await fetchFolders(path);
      const folders = data.entries.filter((e: any) => e['.tag'] === 'folder');
      setFolders(folders);
      setCursor(data.has_more ? data.cursor : null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (token: string) => {
    setAccessToken(token);
    setIsOpen(true);
    setCurrentPath('');
    setPathHistory([]);
    setSelectedFolder(null);
  };

  const closePicker = () => {
    setIsOpen(false);
    setCurrentPath('');
    setPathHistory([]);
    setSelectedFolder(null);
    setFolders([]);
  };

  const handleBack = () => {
    const previousPath = pathHistory[pathHistory.length - 1] || '';
    setCurrentPath(previousPath);
    setPathHistory(prev => prev.slice(0, -1));
    setSelectedFolder(null);
  };

  const handleFolderSelect = (folder: DropboxFolder) => {
    console.log({ folder })
    setSelectedFolder(folder);
  };

  const handleFolderNavigate = (folder: DropboxFolder) => {
    setPathHistory(prev => [...prev, currentPath]);
    setCurrentPath(folder.path_display);
    setSelectedFolder(null);
  };

  useEffect(() => {
    if (isOpen) {
      loadFolders(currentPath);
    }
  }, [isOpen, currentPath]);

  return (
    <DropboxPickerContext.Provider
      value={{
        isOpen,
        currentPath,
        folders,
        loading,
        selectedFolder,
        pathHistory,
        openPicker,
        closePicker,
        handleBack,
        handleFolderSelect,
        handleFolderNavigate,
        selectedDirectory,
        setSelectedDirectory
      }}
    >
      {children}
      <DropboxPickerDialog />
    </DropboxPickerContext.Provider>
  );
}

export const useDropboxPicker = () => {
  const context = useContext(DropboxPickerContext);
  if (!context) {
    throw new Error('useDropboxPicker must be used within a DropboxPickerProvider');
  }
  return context;
};
