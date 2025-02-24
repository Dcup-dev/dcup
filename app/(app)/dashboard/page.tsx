import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return notFound()

  return (<div className="w-full sm:p-6"> </div>)
}
