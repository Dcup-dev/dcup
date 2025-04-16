import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Folder, FolderOpen, PaintBucket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { loadBuckets, loadFolders } from '@/actions/aws';
import { EMPTY_FORM_STATE } from '@/lib/zodErrorHandle';

interface S3PickerProps {
  isOpen: boolean;
  initialBucket?: string;
  initialPrefix?: string;
  setOpen: (state: boolean) => void;
  onSelect: (path: { bucket: string; prefix: string }) => void;
  credentials: any
}

export function S3PickerDialog({
  isOpen,
  initialBucket,
  initialPrefix = '',
  setOpen,
  onSelect,
  credentials
}: S3PickerProps) {
  const [buckets, setBuckets] = useState<string[]>([]);
  const [currentBucket, setCurrentBucket] = useState(initialBucket);
  const [currentPrefix, setCurrentPrefix] = useState(initialPrefix);
  const [folders, setFolders] = useState<string[]>([]);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !currentBucket) {
        handleloadBuckets();
    }
  }, [isOpen, currentBucket]);

  const handleloadBuckets = async () => {
    setError(null)
    setLoading(true);
    try {
      const form = new FormData()
      form.set("credentials", JSON.stringify(credentials))

      const res = await loadBuckets(EMPTY_FORM_STATE, form)
      const buckets = JSON.parse(res.message) as string[]
      setBuckets(buckets);
      setError(null);
    } catch (err) {
      setError('Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFolders = async (bucket: string) => {
    setError(null)
    setCurrentBucket(bucket)
    setLoading(true);
    try {
      const form = new FormData()
      form.set("credentials", JSON.stringify(credentials))
      form.set("bucket", bucket)
      const res = await loadFolders(EMPTY_FORM_STATE, form)
      const folders = JSON.parse(res.message) as string[]
      setFolders(folders);
      setError(null);
    } catch (err) {
      setError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderNavigate = async (folder: string) => {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("credentials", JSON.stringify(credentials));
      form.set("bucket", currentBucket || "");
      form.set("prefix", folder);
      const res = await loadFolders(EMPTY_FORM_STATE, form);
      const folders = JSON.parse(res.message) as string[];
      setPathHistory([...pathHistory, currentPrefix]);
      setCurrentPrefix(`${currentPrefix}${folder}`);
      setFolders(folders);
      setError(null);
    } catch (error) {
      setError('Failed to load folders');
    }
    setLoading(false);
  };

  const handleBack = async () => {
    if (pathHistory.length > 0) {
      setError(null);
      setLoading(true);
      const newHistory = [...pathHistory];
      const previousPrefix = newHistory.pop()!;
      try {
        const form = new FormData();
        form.set("credentials", JSON.stringify(credentials));
        form.set("bucket", currentBucket || "");
        form.set("prefix", previousPrefix);
        const res = await loadFolders(EMPTY_FORM_STATE, form);
        const folders = JSON.parse(res.message) as string[];
        setFolders(folders);
        setError(null);
        setPathHistory(newHistory);
        setCurrentPrefix(previousPrefix);
      } catch (error) {
        setError('Failed to load folders');
      }
      setLoading(false);
    } else if (currentBucket) {
      setCurrentBucket(undefined);
      setCurrentPrefix('');
    }
  };

  const handleSelect = () => {
    if (currentBucket) {
      onSelect({
        bucket: currentBucket,
        prefix: currentPrefix
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#FF9900]" />
            Select S3 Location
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            disabled={!currentBucket && pathHistory.length === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex-1 truncate text-sm font-medium">
            {currentBucket ? `s3://${currentBucket}/${currentPrefix}` : 'Select Bucket'}
          </div>
        </div>

        <ScrollArea className="h-64 rounded-lg border">
          {error ? (
            <div className="p-4 text-center text-sm text-destructive">
              {error}
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : currentBucket ? (
            <div className="space-y-1 p-2">
              {folders.map(folder => (
                <Button
                  key={folder}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleFolderNavigate(folder)}
                >
                  <Folder className="w-5 h-5 text-[#FF9900]" />
                  <span className="truncate">{folder.replace(/\/$/, '')}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-muted-foreground" />
                </Button>
              ))}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {buckets.map(bucket => (
                <Button
                  key={bucket}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => handleLoadFolders(bucket)}
                >
                  <PaintBucket className="w-5 h-5 text-[#FF9900]" />
                  <span className="truncate">{bucket}</span>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!currentBucket}
          >
            {currentPrefix ? 'Select Folder' : 'Select Bucket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
