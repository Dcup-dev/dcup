import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/app/layout.config';
import { Navbar } from '@/components/Navbar/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from "next";


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


export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const sesstion = await getServerSession(authOptions)

  return <HomeLayout {...baseOptions}>
    <Navbar session={sesstion ?? undefined} />
    {children}
    <Toaster />
  </HomeLayout>;
}
