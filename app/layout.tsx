import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { GoogleAnalyticsScript } from './GoogleAnalyticsScript';
import type { Metadata } from "next";
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


export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
       <GoogleAnalyticsScript />
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            links: [
              ['Home', '/'],
              ['Docs', '/docs'],
            ],
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
