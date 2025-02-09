import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { GoogleAnalyticsScript } from './GoogleAnalyticsScript';

const inter = Inter({
  subsets: ['latin'],
});

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
