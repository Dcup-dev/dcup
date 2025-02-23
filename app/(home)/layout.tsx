import type { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Toaster } from '@/components/ui/toaster';

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const sesstion = await getServerSession(authOptions)

  return <>
    <Navbar session={sesstion ?? undefined} />
    {children}
    <Toaster />
  </>;
}
