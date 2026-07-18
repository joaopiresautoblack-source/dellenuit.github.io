import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAbIexqQYAKBy09CJvtVJ85BszzRTdboFQ",
  authDomain: "bellenuit.firebaseapp.com",
  projectId: "bellenuit",
  storageBucket: "bellenuit.firebasestorage.app",
  messagingSenderId: "399665430984",
  appId: "1:399665430984:web:5620ed7753b7cb6d6880fd",
  measurementId: "G-NZEN8H6DSJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

