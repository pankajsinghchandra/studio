import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';

export const metadata: Metadata = {
  title: 'Vidyalaya Notes',
  description: 'Your digital notebook, accessible anywhere.',
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
    <html lang="en" className={cn('dark', inter.variable, spaceGrotesk.variable)}>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased animate-shine'
        )}
      >
        <Header />
        <div className="flex-grow">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
