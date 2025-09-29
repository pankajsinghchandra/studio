"use client";

import { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Define a type for the additional user details stored in Firestore
interface UserDetails {
  name: string;
  mobile: string;
  userClass: string;
  gender: string;
  role: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  const fetchUserDetails = useCallback(async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserDetails(userDoc.data() as UserDetails);
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, fetchUserDetails]);

  return { user, userDetails, loading };
}
