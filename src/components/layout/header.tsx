'use client';

import Link from 'next/link';
import { BookHeart, LogOut, Loader } from 'lucide-react';
import SearchBar from '../search-bar';
import { Button } from '../ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


export default function Header() {
  const { user, userDetails, loading } = useAuth();
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

    if (user && userDetails) {
      const initial = userDetails.name ? userDetails.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
      return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userDetails.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Don't show login button on auth pages
    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
      <Button asChild>
          <Link href="/login">
            Login
          </Link>
      </Button>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

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
          {!isAuthPage && !loading && user && (
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
