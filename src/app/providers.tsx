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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | ''>('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const auth = getAuth(app);

  const fetchUserDetails = useCallback(async (uid: string) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const details = userDoc.data() as UserDetails;
      setUserDetails(details);
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
          // This is a new user (or existing user with no db record)
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
    if (!selectedRole || !termsAccepted) {
      alert('Please select a role and accept the terms.');
      return;
    }
    
    setIsSaving(true);
    const userDocRef = doc(db, "users", user.uid);
    const userData: Partial<UserDetails> = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'New User',
      email: user.email,
      role: selectedRole as 'student' | 'teacher',
      termsAccepted: true,
    };
    
    if (selectedRole === 'student') {
        userData.userClass = selectedClass;
        userData.gender = selectedGender;
    }

    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        await updateDoc(userDocRef, userData);
      } else {
        userData.createdAt = new Date();
        await setDoc(userDocRef, userData);
      }

      await fetchUserDetails(user.uid);
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
        <Dialog open={showOnboarding}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>One Last Step</DialogTitle>
                    <DialogDescription>
                        To continue, please select your role and accept our terms.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>You are a...</Label>
                        <RadioGroup
                            onValueChange={(value) => setSelectedRole(value as 'student' | 'teacher')}
                            value={selectedRole}
                            className="flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="student" id="student" />
                                <Label htmlFor="student" className="font-normal">Student</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="teacher" id="teacher" />
                                <Label htmlFor="teacher" className="font-normal">Teacher</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {selectedRole === 'student' && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="onboarding-class">Class (Optional)</Label>
                                <Select onValueChange={setSelectedClass} value={selectedClass}>
                                    <SelectTrigger id="onboarding-class">
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
                                <Label htmlFor="onboarding-gender">Gender (Optional)</Label>
                                <Select onValueChange={setSelectedGender} value={selectedGender}>
                                    <SelectTrigger id="onboarding-gender">
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
                        <Checkbox id="onboarding-terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                        <Label htmlFor="onboarding-terms" className="text-sm text-muted-foreground">
                            I agree to the{' '}
                            <button
                                type="button"
                                onClick={() => setShowTermsDialog(true)}
                                className="text-primary hover:underline"
                            >
                                Terms &amp; Conditions
                            </button>
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

        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle>नियम एवं शर्तें (Terms &amp; Conditions)</DialogTitle>
                </DialogHeader>
                <div className="prose prose-sm max-h-60 overflow-y-auto pr-4 text-sm text-muted-foreground">
                    <p>इस ऐप का उपयोग करने से पहले कृपया निम्नलिखित शर्तों को ध्यान से पढ़ें:</p>
                    <ul className="list-disc space-y-2">
                        <li><strong>उपयोग की अनुमति:</strong> यह ऐप केवल शैक्षणिक उद्देश्यों के लिए है। उपयोगकर्ता इसका उपयोग सीखने और अभ्यास के लिए कर सकते हैं।</li>
                        <li><strong>डेटा सुरक्षा:</strong> हम उपयोगकर्ता की गोपनीयता का सम्मान करते हैं। ऐप के सुचारू संचालन के लिए केवल आवश्यक तकनीकी डेटा का ही उपयोग किया जाता है।</li>
                        <li><strong>सेवाओं का विस्तार और रखरखाव:</strong> भविष्य में ऐप की गुणवत्ता बनाए रखने, सर्वर के खर्चों और नई सुविधाओं (जैसे स्मार्ट नोट्स, AI सारांश, और ऑफलाइन एक्सेस) को जोड़ने के लिए, ऐप में तृतीय-पक्ष सेवाओं (Third-party services) या प्रमोशनल कंटेंट का समावेश किया जा सकता है। यह उपयोगकर्ताओं के लिए ऐप को 'फ्री' रखने में सहायक होगा।</li>
                        <li><strong>अस्वीकरण (Disclaimer):</strong> यह एक स्वतंत्र पहल है और इसका किसी भी सरकारी विभाग के साथ आधिकारिक वित्तीय संबंध नहीं है। यह ऐप केवल सहायता के उद्देश्य से है। यह किसी भी सरकारी विभाग का आधिकारिक ऐप नहीं है। इस ऐप का उपयोग पूरी तरह से स्वैच्छिक है।</li>
                        <li><strong>सहमति:</strong> ऐप का उपयोग जारी रखकर, आप इन शर्तों से अपनी सहमति प्रदान करते हैं।</li>
                    </ul>
                </div>
                <DialogFooter>
                    <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
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
