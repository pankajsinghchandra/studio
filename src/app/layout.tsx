
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Providers from './providers';
import InstallPWA from '@/components/InstallPWA';

export const metadata: Metadata = {
  title: 'Vidyalaya Notes',
  description: 'Your digital notebook, accessible anywhere.',
  manifest: '/manifest.json',
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, spaceGrotesk.variable)}>
      <head>
        <meta name="theme-color" content="#FF8A65" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <Header />
          <main className="flex-grow">{children}</main>
          <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6">
            <div className="container flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground text-center">
                © 2026 Vidyalaya Notes. All rights reserved.
              </p>
            </div>
          </footer>
          <Toaster />
          <InstallPWA />
        </Providers>
      </body>
    </html>
  );
}
