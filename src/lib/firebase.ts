// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// In development, connect to emulators
if (process.env.NODE_ENV === 'development') {
    // Point to the emulators running on localhost.
    // NOTE: Make sure you have the Firebase emulators running locally.
    // connectAuthEmulator(auth, "http://127.0.0.1:9099");
    // connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // connectStorageEmulator(storage, "127.0.0.1", 9199);
}


export { app, db, storage, auth };