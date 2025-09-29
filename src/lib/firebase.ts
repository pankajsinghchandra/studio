// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'studio-7425086098-7b3fd',
  appId: '1:436062723611:web:d7efdd3af206ac5acd22be',
  apiKey: 'AIzaSyAU-JZplrrAi_or3SZMIZsyqcE4h4zkmIg',
  authDomain: 'studio-7425086098-7b3fd.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '436062723611',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
