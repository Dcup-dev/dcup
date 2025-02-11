'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <main className="flex h-screen flex-col items-center justify-center text-foreground">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex items-center justify-center text-red-500">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <h1 className="text-2xl font-semibold">Uh-oh! Something went terribly wrong.</h1>
        <p className="mt-2 text-muted-foreground pb-5 px-10">
          {error.message || 'Don’t worry, it’s not your fault. Our app just had a little hiccup.'}
        </p>
        <Button
          size="lg"
          onClick={reset}
        >
          <RefreshCw className="h-5 w-5" /> Try Again
        </Button>
      </div>
    </main>
  );
}
