'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface UserDetails {
  name: string;
  mobile: string;
  userClass: string;
  gender: string;
  role: 'student' | 'teacher' | 'admin';
  email: string;
  termsAccepted?: boolean;
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
  const [showTermsPrompt, setShowTermsPrompt] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);
  const auth = getAuth(app);

  const fetchUserDetails = useCallback(async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const details = userDoc.data() as UserDetails;
        setUserDetails(details);
        if (!details.termsAccepted) {
            setShowTermsPrompt(true);
        }
      } else {
        console.log("No such user document!");
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUserDetails(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        await fetchUserDetails(user.uid);
      } else {
        setUser(null);
        setUserDetails(null);
        setShowTermsPrompt(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserDetails]);

  const handleAcceptTerms = async () => {
      if (!user) return;
      setIsAcceptingTerms(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { termsAccepted: true });
        setUserDetails(prev => prev ? { ...prev, termsAccepted: true } : null);
        setShowTermsPrompt(false);
      } catch (error) {
          console.error("Error accepting terms: ", error);
      } finally {
          setIsAcceptingTerms(false);
      }
  };


  const value = { user, userDetails, loading, fetchUserDetails };

  return (
    <AuthContext.Provider value={value}>
        {children}
        <Dialog open={showTermsPrompt}>
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>नियम एवं शर्तें (Terms & Conditions)</DialogTitle>
                    <DialogDescription>
                        इस ऐप का उपयोग जारी रखने के लिए, कृपया हमारी शर्तों को स्वीकार करें।
                    </DialogDescription>
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
                    <Button onClick={handleAcceptTerms} disabled={isAcceptingTerms}>
                        {isAcceptingTerms ? "Accepting..." : "I Accept the Terms"}
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
