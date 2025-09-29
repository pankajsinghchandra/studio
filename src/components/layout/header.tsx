'use client';

import Link from 'next/link';
import { BookHeart, User, LogOut, Loader } from 'lucide-react';
import SearchBar from '../search-bar';
import { Button } from '../ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { user, loading } = useAuth();
  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const handleLogout = () => {
    signOut(auth).then(() => {
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    }).catch((error) => {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message,
      });
    });
  };

  const renderAuthButton = () => {
    if (loading) {
      return (
        <Button variant="ghost" size="icon" disabled>
          <Loader className="h-5 w-5 animate-spin" />
        </Button>
      );
    }

    if (user) {
      return (
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      );
    }

    // Don't show login button on auth pages
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
      <Button asChild variant="ghost" size="icon">
          <Link href="/login">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Link>
      </Button>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

  // Don't render header on auth pages if user is not logged in and not loading
  if (!user && isAuthPage && !loading) {
      return null;
  }
  
  // Also, for protected pages, if we are loading or there's no user,
  // we can return a minimal header or nothing to avoid flashes of content.
  // The redirection is handled in the page itself (e.g., `src/app/page.tsx`).
  if (!isAuthPage && (loading || !user)) {
     return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center">
                 <Link href="/" className="mr-6 flex items-center space-x-2">
                    <BookHeart className="h-6 w-6 text-primary" />
                    <span className="hidden font-bold sm:inline-block font-headline">
                        Vidyalaya Notes
                    </span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-2">
                   <Button variant="ghost" size="icon" disabled>
                        <Loader className="h-5 w-5 animate-spin" />
                    </Button>
                </div>
            </div>
        </header>
     )
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookHeart className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block font-headline">
            Vidyalaya Notes
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!isAuthPage && (
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <SearchBar />
            </div>
          )}
          {renderAuthButton()}
        </div>
      </div>
    </header>
  );
}
