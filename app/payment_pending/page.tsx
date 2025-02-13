import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function page() {
  if (process.env.NEXT_PUBLIC_PAYMENT!) return notFound();
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="max-w-lg w-full text-center shadow-lg border bg-primary-foreground">
        <CardHeader>
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-semibold mt-4">
            Subscriptions Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-fd-primary text-xl">
            Our payment provider is currently reviewing our subscription setup.
            This process may take up to <strong>3 days</strong>.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>Estimated approval time: 3 days</span>
          </div>
          <Button asChild className="mt-6" size='lg'>
            <Link href="/">Go Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
