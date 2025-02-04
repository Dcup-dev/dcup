import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { Navbar } from '@/components/Navbar/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation'
import { Toaster } from '@/components/ui/toaster';

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {

  const session = await getServerSession(authOptions)
  if (!session) return redirect("/login")

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Integration", href: "/integration" },
    { name: "Docs", href: "/docs" },
  ];

  return <HomeLayout {...baseOptions}>
    <Navbar navLinks={navLinks} session={session} />
    {children}
    <Toaster />
  </HomeLayout>;
}
