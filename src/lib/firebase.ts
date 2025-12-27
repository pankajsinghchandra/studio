// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'studio-7425086098-7b3fd',
  appId: '1:436062723611:web:85100a17b385b130cd22be',
  apiKey: 'AIzaSyAU-JZplrrAi_or3SZMIZsyqcE4h4zkmIg',
  authDomain: 'studio-7425086098-7b3fd.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '436062723611',
  storageBucket: 'studio-7425086098-7b3fd.appspot.com',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Check if we are in a development environment and not in production
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && !auth.emulatorConfig) {
    // Point to the Auth emulator
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    console.log("Auth emulator connected for development.");
}


export { app, db, storage, auth };
