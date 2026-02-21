import { AuthForm } from "@/components/Auth/AuthForm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) redirect("/");

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden">
      <div className="relative w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
}
