"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Loader } from "@/components/Loader/Loader";
import { signIn } from "next-auth/react";
import { FaFacebook, FaGithub, FaGoogle } from "react-icons/fa";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignInErrorMessage } from "@/lib/errors/auth_hook";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter()
  const params = useSearchParams();
  const errorType = params.get("error");

  const decodedErrorType = decodeURIComponent(errorType || "");
  const errorMessage = useSignInErrorMessage(decodedErrorType);

  const loginWith = (method: string) => {
    startTransition(async () => {
      const login = async () => {
        try {
          const res = await signIn(method)
          if (res?.error) {
            router.push(`/login?error=${encodeURIComponent(res.error)}`);
          } else if (res?.ok) {
            router.push("/dashboard");
          }
        } catch {
          router.push(
            `/login?error=${encodeURIComponent("An unexpected error occurred")}`,
          );
        }
        return;
      };
      await login();
    });
  };
  if (isPending) {
    return <Loader />;
  }


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {errorType && errorMessage && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>SignIn Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Welcone to Dcup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Button className="w-full" onClick={() => loginWith("google")}>
              <FaGoogle size={32} />
              Login with Google
            </Button>
            <Button className="w-full" onClick={() => loginWith('github')}>
              <FaGithub size={32} />
              Login with github
            </Button>
            <Button className="w-full" onClick={() => loginWith("facebook")}>
              <FaFacebook size={32} />
              Login with Facebook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
