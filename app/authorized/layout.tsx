import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { ReactNode } from "react";


export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return notFound()

  return (<main>
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {children}
    </div>
  </main>
  );
}
