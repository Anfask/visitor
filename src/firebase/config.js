// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAa5PbXoSZo2n1_xW4gZILxX8P6DHOhKcY",
  authDomain: "visitors-management-dc069.firebaseapp.com",
  projectId: "visitors-management-dc069",
  storageBucket: "visitors-management-dc069.firebasestorage.app",
  messagingSenderId: "378311377800",
  appId: "1:378311377800:web:0b3c0acba60605166df03d",
  measurementId: "G-MJX4E05PDT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };