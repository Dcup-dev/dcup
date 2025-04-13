"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { useDropboxPicker } from './dropbox-picker.context';

export function DropboxPickerDialog() {
  const {
    isOpen,
    currentPath,
    folders,
    loading,
    selectedFolder,
    pathHistory,
    closePicker,
    handleBack,
    handleFolderSelect,
    handleFolderNavigate,
    setSelectedDirectory
  } = useDropboxPicker();

    const handleFinalSelect = () => {
    if (selectedFolder) {
      setSelectedDirectory({
        name: selectedFolder.path_display,
        id: selectedFolder.id
      });
    } else {
      setSelectedDirectory({
        name: currentPath || 'Root',
        id: 'root'
      });
    }
    closePicker();
  };

  return (
    <Dialog open={isOpen} onOpenChange={closePicker}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Select Dropbox Folder
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            disabled={pathHistory.length === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 truncate text-sm font-medium">
            {currentPath || '/ (Root)'}
          </div>
          <Button
            variant={!selectedFolder ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => handleFolderSelect({ name: 'root', id: "", path_display: "root", '.tag': 'folder' })}
          >
            Select Root Folder
          </Button>
        </div>

        <ScrollArea className="h-64 rounded-lg border">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading folders...
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {folders.map(folder => (
                <Button
                  key={folder.id}
                  variant={selectedFolder?.id === folder.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleFolderSelect(folder)}
                  onDoubleClick={() => handleFolderNavigate(folder)}
                >
                  <Folder className="w-5 h-5 text-yellow-600" />
                  <span className="truncate">{folder.name}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={closePicker}>
            Cancel
          </Button>
          <Button onClick={handleFinalSelect} disabled={!selectedFolder && !currentPath}>
            {selectedFolder ? 'Select Folder' : 'Select Current Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
