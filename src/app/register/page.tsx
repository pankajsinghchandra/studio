'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Checkbox } from "@/components/ui/checkbox";

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export default function RegisterPage() {
    const router = useRouter();
    const auth = getAuth(app);
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [userClass, setUserClass] = useState('');
    const [gender, setGender] = useState('');
    const [role, setRole] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [showTermsDialog, setShowTermsDialog] = useState(false);
    const [pendingUser, setPendingUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState('');

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        try {
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
    
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
    
          if (userDoc.exists() && userDoc.data()?.role) {
             toast({
                title: "Login Successful!",
                description: "Welcome back!",
            });
            router.push('/');
          } else {
            setPendingUser(user);
            setShowRoleDialog(true);
          }
        } catch (error: any) {
           if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/unauthorized-domain') {
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
        if (!termsAccepted) {
            toast({ variant: "destructive", title: "Please accept the terms and conditions." });
            return;
        }
        
        setIsLoading(true);
        const userDocRef = doc(db, "users", pendingUser.uid);
        const userDoc = await getDoc(userDocRef);

        const userData = {
            uid: pendingUser.uid,
            name: pendingUser.displayName,
            email: pendingUser.email,
            role: selectedRole,
            termsAccepted: true,
        };

        try {
            if (userDoc.exists()) {
                await updateDoc(userDocRef, { role: selectedRole, termsAccepted: true });
            } else {
                await setDoc(userDocRef, { ...userData, createdAt: new Date() });
            }
            setShowRoleDialog(false);
            // Sign out to force a re-login, which will trigger the auth listener correctly
            await auth.signOut(); 
            toast({
                title: "Registration Successful!",
                description: "Please log in to continue.",
            });
            router.push('/login');
        } catch (error: any) {
             console.error("Error setting role: ", error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save your role. Please try again.",
             });
        } finally {
            setIsLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (!role) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select a role (Teacher or Student).",
            });
            setIsLoading(false);
            return;
        }
        if (!termsAccepted) {
            toast({
                variant: "destructive",
                title: "Terms & Conditions",
                description: "You must accept the terms and conditions to register.",
            });
            setIsLoading(false);
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            const userDocRef = doc(db, "users", user.uid);
            const userData = {
                uid: user.uid,
                name,
                email,
                userClass: role === 'student' ? userClass : '',
                gender: role === 'student' ? gender : '',
                role,
                termsAccepted: true,
                createdAt: new Date(),
            };

            await setDoc(userDocRef, userData);
            await auth.signOut();
            
            toast({
                title: "Registration Successful!",
                description: "You can now log in with your new credentials.",
            });
            router.push('/login');

        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: "This email is already registered. Please login instead.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Registration Failed",
                    description: error.message,
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-8">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
              <CardDescription>Fill in the details below to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                  {isGoogleLoading ? <Loader className="animate-spin mr-2"/> : <GoogleIcon />} 
                  Sign up with Google
              </Button>
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                          Or create an account with email
                      </span>
                  </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
             
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                  <Label>You are a...</Label>
                  <RadioGroup onValueChange={setRole} value={role} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="student" id="student" />
                          <Label htmlFor="student">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="teacher" id="teacher" />
                          <Label htmlFor="teacher">Teacher</Label>
                      </div>
                  </RadioGroup>
              </div>
              
              {role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="class">Class (Optional)</Label>
                          <Select name="class" onValueChange={setUserClass} value={userClass}>
                              <SelectTrigger id="class">
                                  <SelectValue placeholder="Select Class" />
                              </SelectTrigger>
                              <SelectContent>
                                  {Array.from({ length: 6 }, (_, i) => i + 3).map(c => (
                                      <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="gender">Gender (Optional)</Label>
                          <Select name="gender" onValueChange={setGender} value={gender}>
                              <SelectTrigger id="gender">
                                  <SelectValue placeholder="Select Gender" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
              )}
               <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <button
                            type="button"
                            onClick={() => setShowTermsDialog(true)}
                            className="text-primary hover:underline"
                        >
                            Terms & Conditions
                        </button>
                    </Label>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading || !termsAccepted}>
                  {isLoading && <Loader className="animate-spin mr-2"/>}
                  Register
              </Button>
              <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Login
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
                Please select your role and accept the terms to complete your registration.
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
               <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="google-terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                    <Label htmlFor="google-terms" className="text-sm text-muted-foreground">
                        I agree to the{' '}
                        <button
                            type="button"
                            onClick={() => setShowTermsDialog(true)}
                            className="text-primary hover:underline"
                        >
                            Terms & Conditions
                        </button>
                    </Label>
                </div>
            </div>
            <DialogFooter>
              <Button onClick={handleRoleSubmit} disabled={!selectedRole || isLoading || !termsAccepted}>
                {isLoading && <Loader className="animate-spin mr-2"/>}
                Complete Sign-Up
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>नियम एवं शर्तें (Terms & Conditions)</DialogTitle>
                </DialogHeader>
                <div className="prose prose-sm max-h-60 overflow-y-auto pr-4 text-sm text-muted-foreground">
                    <p>इस ऐप का उपयोग करने से पहले कृपया निम्नलिखित शर्तों को ध्यान से पढ़ें:</p>
                    <ul className="list-disc space-y-2">
                        <li><strong>उपयोग की अनुमति:</strong> यह ऐप केवल शैक्षणिक उद्देश्यों के लिए है। उपयोगकर्ता इसका उपयोग सीखने और अभ्यास के लिए कर सकते हैं।</li>
                        <li><strong>डेटा सुरक्षा:</strong> हम उपयोगकर्ता की गोपनीयता का सम्मान करते हैं। ऐप के सुचारू संचालन के लिए केवल आवश्यक तकनीकी डेटा का ही उपयोग किया जाता है।</li>
                        <li><strong>सेवाओं का विस्तार और रखरखाव:</strong> भविष्य में ऐप की गुणवत्ता बनाए रखने, सर्वर के खर्चों और नई सुविधाओं (जैसे AI मोड, ऑफलाइन टेस्ट) को जोड़ने के लिए, ऐप में तृतीय-पक्ष सेवाओं (Third-party services) या प्रमोशनल कंटेंट का समावेश किया जा सकता है। यह उपयोगकर्ताओं के लिए ऐप को 'फ्री' रखने में सहायक होगा।</li>
                        <li><strong>अस्वीकरण (Disclaimer):</strong> यह एक स्वतंत्र पहल है और इसका किसी भी सरकारी विभाग के साथ आधिकारिक वित्तीय संबंध नहीं है। यह ऐप केवल सहायता के उद्देश्य से है। यह किसी भी सरकारी विभाग का आधिकारिक ऐप नहीं है। इस ऐप का उपयोग पूरी तरह से स्वैच्छिक है।</li>
                        <li><strong>सहमति:</strong> ऐप का उपयोग जारी रखकर, आप इन शर्तों से अपनी सहमति प्रदान करते हैं।</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
