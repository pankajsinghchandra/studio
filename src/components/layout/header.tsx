'use client';

import Link from 'next/link';
import { Sparkles, LogOut, Loader, Shield, LayoutDashboard, Settings, Info, ExternalLink, GraduationCap, Heart, UserCheck } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '../ui/separator';

export default function Header() {
  const { user, userDetails, loading, fetchUserDetails } = useAuth();
  const auth = getAuth(app);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tempName, setTempName] = useState(userDetails?.name || '');
  const [tempRole, setTempRole] = useState(userDetails?.role || '');
  const [tempClass, setTempClass] = useState(userDetails?.userClass || '');
  const [tempGender, setTempGender] = useState(userDetails?.gender || '');

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
    setTempClass(userDetails?.userClass || '');
    setTempGender(userDetails?.gender || '');
    setIsSettingsOpen(true);
  }

  const handleSettingsSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updates: { [key: string]: any } = { name: tempName };
      
      if (!isAdmin) {
        updates.role = tempRole;
        if (tempRole === 'student') {
            updates.userClass = tempClass;
            updates.gender = tempGender;
        }
      }
      
      await updateDoc(userDocRef, updates);
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

  const isAdmin = userDetails?.email === 'quizpankaj@gmail.com';

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
        <>
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
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>User Dashboard</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={openSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAboutUsOpen(true)}>
                      <Info className="mr-2 h-4 w-4" />
                      <span>About Us</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </>
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
          <Sparkles className="h-6 w-6 text-primary" />
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
                    Update your profile here. Click save when you're done.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={tempName} onChange={(e) => setTempName(e.target.value)} className="col-span-3" />
                </div>
                 {!isAdmin && (
                    <>
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
                        {tempRole === 'student' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                               <Label htmlFor="class" className="text-right">Class</Label>
                                <Select onValueChange={setTempClass} value={tempClass}>
                                    <SelectTrigger id="class" className="col-span-3">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 8 }, (_, i) => i + 3).map(c => (
                                          <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                         {tempRole === 'student' && (
                            <div className="grid grid-cols-4 items-center gap-4">
                               <Label htmlFor="gender" className="text-right">Gender</Label>
                                <Select onValueChange={setTempGender} value={tempGender}>
                                    <SelectTrigger id="gender" className="col-span-3">
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </>
                 )}
            </div>
            <DialogFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button disabled={isSaving}>
                            {isSaving ? <Loader className="animate-spin mr-2"/> : null}
                            Save changes
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will update your profile information.
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
    
    <Dialog open={isAboutUsOpen} onOpenChange={setIsAboutUsOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-xl border-primary/20 shadow-2xl p-0 gap-0">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles className="w-32 h-32 text-primary" />
            </div>
            
            <DialogHeader className="p-6 md:p-8 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <DialogTitle className="font-headline text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        Vidyalaya Notes
                    </DialogTitle>
                </div>
                <DialogDescription className="text-base md:text-lg font-medium text-foreground/80">
                    आपकी डिजिटल लाइब्रेरी - शिक्षा की नई उमंग
                </DialogDescription>
            </DialogHeader>

            <div className="px-6 md:px-8 py-4 space-y-6">
                <div className="relative p-5 md:p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner text-sm md:text-base">
                    <p className="text-foreground leading-relaxed italic">
                        &quot;Vidyalaya Notes&quot; शिक्षकों और छात्रों के लिए एक आधुनिक सहायक उपकरण (Teaching-Learning Aid) है, जिसे शिक्षा को सुलभ और मज़ेदार बनाने के लिए डिज़ाइन किया गया है।
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-4 items-start p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">हमारा विजन</h4>
                            <p className="text-xs text-muted-foreground">क्लासरूम की पढ़ाई को रोचक बनाने के लिए वीडियो, गानों और विजुअल माइंडमैप्स उपलब्ध कराना।</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <Heart className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">स्वामित्व</h4>
                            <p className="text-xs text-muted-foreground">इस प्लेटफॉर्म का संचालन और तकनीकी रखरखाव श्रीमती मीरा देवी द्वारा किया जाता है।</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">कंटेंट क्रेडिट</h4>
                            <p className="text-xs text-muted-foreground">सामग्री अनुभवी शिक्षकों के परामर्श और NCERT/SCERT के पाठ्यक्रम पर आधारित है।</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm mb-1">स्वयंसेवी पहल</h4>
                            <p className="text-xs text-muted-foreground">यह ऐप शिक्षकों के शिक्षण कार्य को सुलभ बनाने के लिए एक नि:शुल्क सेवा है।</p>
                        </div>
                    </div>
                </div>

                <Separator className="opacity-50" />

                <div className="pb-8">
                    <h4 className="font-headline text-lg font-bold text-primary mb-4 flex items-center gap-2">
                        हमारे अन्य उपयोगी ऐप्स
                    </h4>
                    <Link 
                        href="https://myonlinetest.netlify.app" 
                        target="_blank"
                        className="group block p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-center gap-4">
                            <div className="space-y-1">
                                <h5 className="font-bold text-lg md:text-xl flex items-center gap-2 text-white">
                                    My Test
                                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Online Exam</span>
                                </h5>
                                <p className="text-blue-100 text-xs md:text-sm">परीक्षा की तैयारी के लिए यहाँ क्लिक करें और अभ्यास शुरू करें...</p>
                            </div>
                            <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors shrink-0">
                                <ExternalLink className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    </>
  );
}
