import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import HeroHeader from '@/components/HeroHeader/HeroHeader';
import HowItWorks from '@/components/HowItWorks/HowItWorks';
import { Pricing } from '@/components/Pricing/Pricing';
import DashboardSection from '@/components/DashboardSection/DashboardSection';
import Footer from '@/components/Footer/Footer';
import ApiShowcase from '@/components/ApiShowcase/ApiShowcase';


export default async function HomePage() {
  const sesstion = await getServerSession(authOptions)

  if (sesstion) return redirect("/dashboard")
  return (
    <main>
      <HeroHeader />
      <HowItWorks />
      <div className='p-10' />
      <DashboardSection />
      {/* api and how to use it, todo  */}
      <Pricing isAuth={!!sesstion} />
      <ApiShowcase />
      <Footer />
    </main>
  );
}
