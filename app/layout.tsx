import './global.css';
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import type { Metadata } from "next";
import { mockServer } from '@/mocks/server';
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"


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
  console.log('🔧🔧🔧 MSW mock server starting...🔧🔧🔧');
  mockServer.listen({
    onUnhandledRequest: 'bypass',
  });
  (global as any).__MSW_SERVER_STARTED__ = true;
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
        ><TooltipProvider>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-stone-50 via-stone-100 to-stone-200 dark:from-stone-950 dark:via-stone-900 dark:to-stone-800" />

            {/* Animated abstract shapes */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
            </div>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
