'use client';

import Link from 'next/link';
import { BookHeart, LogOut, Loader, Shield, LayoutDashboard, Settings } from 'lucide-react';
import SearchBar from '../search-bar';
import { Button } from '../ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/providers';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


export default function Header() {
  const { user, userDetails, loading, fetchUserDetails } = useAuth();
  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempName, setTempName] = useState(userDetails?.name || '');
  const [tempRole, setTempRole] = useState(userDetails?.role || '');

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
  
  const openSettings = () => {
    setTempName(userDetails?.name || user?.displayName || '');
    setTempRole(userDetails?.role || '');
    setIsSettingsOpen(true);
  }

  const handleSettingsSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        name: tempName,
        role: tempRole
      });
      await fetchUserDetails(user.uid); // Refetch user details
      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      setIsSettingsOpen(false);
    } catch(error) {
        console.error("Error updating profile: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update profile.',
        });
    } finally {
        setIsSaving(false);
    }
  }

  const isAdmin = user && user.email === 'quizpankaj@gmail.com';

  const renderAuthSection = () => {
    if (loading) {
      return (
        <Button variant="ghost" size="icon" disabled>
          <Loader className="h-5 w-5 animate-spin" />
        </Button>
      );
    }

    if (user) {
       const initial = userDetails?.name ? userDetails.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : 'U');
      return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || ''} alt={userDetails?.name || ''} />
                        <AvatarFallback>{initial}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userDetails?.name || user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuItem onClick={() => router.push('/admin/dashboard')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>User Dashboard</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                    <DropdownMenuItem onClick={openSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                )}
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
    <>
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
          {renderAuthSection()}
        </div>
      </div>
    </header>

    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Profile Settings</DialogTitle>
                <DialogDescription>
                    Update your name and role here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={tempName} onChange={(e) => setTempName(e.target.value)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                     <Select onValueChange={setTempRole} value={tempRole}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                 <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="submit" disabled={isSaving}>
                          {isSaving ? <Loader className="animate-spin mr-2"/> : null}
                          Save changes
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will update your profile information.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSettingsSave}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
