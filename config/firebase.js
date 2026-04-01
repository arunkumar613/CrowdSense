import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyPlaceholderKeyForFirebaseConfig",
  authDomain: "crowdsense-placeholder.firebaseapp.com",
  projectId: "crowdsense-placeholder",
  storageBucket: "crowdsense-placeholder.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
