'use client';

import Link from 'next/link';
import { BookHeart, User, LogOut } from 'lucide-react';
import SearchBar from '../search-bar';
import { Button } from '../ui/button';
import { getAuth, onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function Header() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const auth = getAuth(app);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

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
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <SearchBar />
          </div>
          {user ? (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          ) : (
            <Link href="/login" legacyBehavior>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
