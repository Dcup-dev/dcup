import Link from 'next/link'
import { authOptions } from '@/auth'
import { Connectors } from '@/components/Connectors/Connectors';
import { Button } from '@/components/ui/button';
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation';

export default async function page() {
  const session = await getServerSession(authOptions)
  if (!session?.user.id) return redirect("/login")

  return (<div className="container mx-auto p-5">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Connected Services
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          Manage your data sources and keep your application in sync.
        </p>
      </div>
      <Button asChild>
        <Link href={"/connections"}>
          Sources
        </Link>
      </Button>
    </div>
    <Connectors />
  </div>)
}
