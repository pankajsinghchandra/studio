'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { FirestorePermissionError } from "@/firebase/errors";
import { errorEmitter } from "@/firebase/error-emitter";
import { useAuth } from "@/app/providers";

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, userDetails } = useAuth();
  const auth = getAuth(app);
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  useEffect(() => {
    if (!authLoading && user) {
      if (userDetails?.email === 'quizpankaj@gmail.com') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, userDetails, router]);

  const handleLoginSuccess = (user: User) => {
    toast({
        title: "Login Successful!",
        description: "Welcome back!",
    });
    // The useEffect above will handle redirection.
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // handleLoginSuccess(userCredential.user);
        // Let the onAuthStateChanged listener and useEffect handle the redirection logic
      })
      .catch((error) => {
        const errorMessage = error.message;
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
      })
      .finally(() => setIsLoading(false));
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, let the useEffect handle redirection
      } else {
        setPendingUser(user);
        setShowRoleDialog(true);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: error.message,
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRoleSubmit = async () => {
    if (!pendingUser || !selectedRole) {
      toast({ variant: "destructive", title: "Please select a role." });
      return;
    }
    
    setIsLoading(true);
    const userDocRef = doc(db, "users", pendingUser.uid);
    const userData = {
      uid: pendingUser.uid,
      name: pendingUser.displayName,
      email: pendingUser.email,
      role: selectedRole,
      createdAt: new Date(),
    };

    setDoc(userDocRef, userData)
      .then(() => {
        setShowRoleDialog(false);
        toast({
            title: "Registration Successful!",
            description: "Welcome! You can now access your dashboard.",
        });
        // The onAuthStateChanged listener will handle the new user state and redirect.
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: userData,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  if (authLoading || user) {
      return <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50"><Loader className="h-10 w-10 animate-spin text-primary" /></div>
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-4">
                  <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                    {isGoogleLoading ? <Loader className="animate-spin mr-2"/> : <GoogleIcon />} 
                    Continue with Google
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading && <Loader className="animate-spin mr-2"/>}
                Login
              </Button>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
      
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>One Last Step</DialogTitle>
            <DialogDescription>
              Please select your role to complete your registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="role-select">You are a...</Label>
            <Select onValueChange={setSelectedRole} required>
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleRoleSubmit} disabled={!selectedRole || isLoading}>
              {isLoading && <Loader className="animate-spin mr-2"/>}
              Complete Sign-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
