import './global.css';
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from "next";
import { Toaster } from '@/components/ui/toaster';
import { mockServer } from '@/mocks/server';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Dcup",
  description: "Dcup",
  metadataBase: new URL("https://dcup.dev"),
  openGraph: {
    title: "Dcup",
    description: "Dcup",
    url: "https://dcup.dev",
    siteName: "Dcup",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dcup",
    description: "Dcup"
  },
};

if (process.env.NEXT_PUBLIC_APP_ENV === 'TEST') {
  if (!(global as any).__MSW_SERVER_STARTED__) {
    console.log('🔧 MSW mock server starting...');
    mockServer.listen();
    (global as any).__MSW_SERVER_STARTED__ = true;
  }
}

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
