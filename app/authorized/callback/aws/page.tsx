"use client"
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaAws, FaKey, FaLock, FaGlobe, FaServer } from "react-icons/fa";
import { useActionState } from "react";
import { authorizeAWS } from "@/actions/connctions/new";
import { EMPTY_FORM_STATE } from "@/lib/zodErrorHandle";
import { useFormStatus } from "react-dom";
import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function S3AuthForm() {
  const [state, formAction] = useActionState(authorizeAWS, EMPTY_FORM_STATE);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-background">
        {state.status === 'ERROR' && <Alert variant="destructive">
          <TriangleAlertIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>}
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <FaAws className="h-8 w-8 text-[#FF9900]" />
            <span className="text-2xl font-bold">S3 Connection</span>
          </div>
          <CardDescription className="text-center">
            Connect to your AWS S3 bucket or compatible storage
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              {/* Access Key ID */}
              <div className="space-y-2">
                <Label htmlFor="accessKeyId" className="flex items-center gap-1">
                  <FaKey className="h-4 w-4" />
                  Access Key ID
                </Label>
                <Input
                  id="accessKeyId"
                  name="accessKeyId"
                  placeholder="AKIAXXXXXXXXXXXXXXXX"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Found in IAM &gt; Users &gt; Security credentials
                </p>
              </div>

              {/* Secret Access Key */}
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="flex items-center gap-1">
                  <FaLock className="h-4 w-4" />
                  Secret Access Key
                </Label>
                <Input
                  id="secretKey"
                  name="secretKey"
                  type="password"
                  placeholder="••••••••••••••••••••"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Only visible when first created
                </p>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-1">
                  <FaGlobe className="h-4 w-4" />
                  Region
                </Label>
                <Input
                  id="region"
                  name="region"
                  placeholder="e.g. us-west-2"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Found in AWS console top right
                </p>
              </div>

              {/* Endpoint (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="flex items-center gap-1">
                  <FaServer className="h-4 w-4" />
                  Endpoint (Optional)
                </Label>
                <Input
                  id="endpoint"
                  placeholder="For S3-compatible services"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for AWS S3
                </p>
              </div>
            </div>
            <ConnectBtn />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
const ConnectBtn = () => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full gap-2">
      {pending ? (
        <>
          <RotateCcwIcon className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </>
      ) : (
        <>
          <FaAws className="h-4 w-4" />
          Connect to S3
        </>
      )}
    </Button>
  );
};
