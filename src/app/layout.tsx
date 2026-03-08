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
        <meta name="theme-color" content="#21a169" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>
          <Header />
          <div className="flex-grow">{children}</div>
          <Toaster />
          <InstallPWA />
        </Providers>
      </body>
    </html>
  );
}
