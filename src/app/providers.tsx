'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
