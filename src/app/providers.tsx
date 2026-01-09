'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader } from 'lucide-react';

interface UserDetails {
  uid: string;
  name: string;
  email: string | null;
  role: 'student' | 'teacher' | 'admin';
  termsAccepted: boolean;
  createdAt: any;
  userClass?: string;
  gender?: string;
}

interface AuthContextType {
  user: User | null;
  userDetails: UserDetails | null;
  loading: boolean;
  fetchUserDetails: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDetails: null,
  loading: true,
  fetchUserDetails: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const auth = getAuth(app);

  const fetchUserDetails = useCallback(async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const details = userDoc.data() as UserDetails;
      setUserDetails(details);
      // If user exists but hasn't accepted terms or selected a role, trigger onboarding
      if (!details.termsAccepted || !details.role) {
        setShowOnboarding(true);
      }
      return details;
    }
    return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const details = await fetchUserDetails(firebaseUser.uid);
        if (!details) {
          // This is a new user (or existing user without a DB record)
          setShowOnboarding(true);
        }
      } else {
        setUser(null);
        setUserDetails(null);
        setShowOnboarding(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth, fetchUserDetails]);

  const handleOnboardingSubmit = async () => {
    if (!user) return;
    if (!selectedRole) {
      alert('Please select a role.'); // Replace with toast
      return;
    }
     if (!termsAccepted) {
        alert('Please accept the terms and conditions.'); // Replace with toast
        return;
    }
    
    setIsSaving(true);
    const userDocRef = doc(db, "users", user.uid);
    const userData: UserDetails = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'New User',
      email: user.email,
      role: selectedRole as 'student' | 'teacher',
      termsAccepted: true,
      createdAt: new Date(),
    };

    try {
      // Use setDoc with merge to create or update the user document
      await setDoc(userDocRef, userData, { merge: true });
      setUserDetails(userData); // Update local state immediately
      setShowOnboarding(false);
    } catch (error) {
        console.error("Error saving user details: ", error);
        alert('Failed to save details. Please try again.');
    } finally {
        setIsSaving(false);
    }
  };
  
    const value = { user, userDetails, loading, fetchUserDetails };

  return (
    <AuthContext.Provider value={value}>
        {children}
        <Dialog open={showOnboarding} onOpenChange={(open) => !open && setShowOnboarding(false)}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>One Last Step</DialogTitle>
                    <DialogDescription>
                        To continue, please select your role and accept our terms.
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
                            <Checkbox id="onboarding-terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                            <Label htmlFor="onboarding-terms" className="text-sm text-muted-foreground">
                                I have read and agree to the Terms & Conditions.
                            </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleOnboardingSubmit} disabled={isSaving || !selectedRole || !termsAccepted}>
                        {isSaving ? <Loader className="animate-spin mr-2"/> : null}
                        Save and Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
