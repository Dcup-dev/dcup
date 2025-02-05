import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import HeroHeader from '@/components/HeroHeader/HeroHeader';


export default async function HomePage() {
  const sesstion = await getServerSession(authOptions)

  if (sesstion) return redirect("/dashboard")
  return (
    <main>
      <HeroHeader />
    </main>
  );
}
