// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
