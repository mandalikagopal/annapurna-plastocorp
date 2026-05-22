import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAfUp9zabAltfRcJ0oQGIVrsH_XxPueYJQ",
  authDomain: "annapurna-plastocorp.firebaseapp.com",
  projectId: "annapurna-plastocorp",
  storageBucket: "annapurna-plastocorp.firebasestorage.app",
  messagingSenderId: "158984283986",
  appId: "1:158984283986:web:28919fd01d31433eb47c8b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
