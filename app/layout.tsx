import './global.css';
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { GoogleAnalyticsScript } from './GoogleAnalyticsScript';
import type { Metadata } from "next";
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset,SidebarProvider,SidebarTrigger} from "@/components/ui/sidebar"
import { Toaster } from '@/components/ui/toaster';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Navbar } from '@/components/Navbar/Navbar';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Transform Documents Into Perfect JSON with Dcup",
  metadataBase: new URL("https://dcup.dev"),
  description:
    "Instantly convert PDFs, Docs, Sheets,PowerPoint,CSV,Web pages, Raw HTML and Markdown to structured JSON with AI-powered precision. Define your schema, get perfect results - every time.",
  openGraph: {
    title: "Dcup - Transform Documents Into Perfect JSON",
    description:
      "Instantly convert PDFs, Docs, Sheets,PowerPoint,CSV,Web pages, Raw HTML and Markdown to structured JSON with AI-powered precision. Define your schema, get perfect results - every time.",
    url: "https://dcup.dev",
    siteName: "Dcup",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dcup - Transform Documents Into Perfect JSON",
    description:
      "Instantly convert PDFs, Docs, Sheets,PowerPoint,CSV,Web pages, Raw HTML and Markdown to structured JSON with AI-powered precision. Define your schema, get perfect results - every time.",
  },
  keywords: [
    "JSON conversion API",
    "document to JSON",
    "PDF parsing",
    "AI data preparation",
    "structured data extraction",
    "customizable schema",
    "Golang API",
    "scalable data processing",
    "invoice automation",
    "AI/ML training data",
  ],
};


export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <GoogleAnalyticsScript />
      <body className="flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <GoogleAnalyticsScript />
      <body className="flex flex-col min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider>
              <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
                <Toaster />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
