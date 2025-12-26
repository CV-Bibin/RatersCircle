// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";        // Needed for Login
import { getDatabase } from "firebase/database"; // Needed for Realtime Chat

const firebaseConfig = {
  apiKey: "AIzaSyBqvyQHCrmRTz2wFw88KfeLFWZJkS9C3Rs",
  authDomain: "chatapp-38b38.firebaseapp.com",
  projectId: "chatapp-38b38",
  // IMPORTANT: You must paste your Realtime Database URL here!
  // It usually looks like this (check your Firebase Console to be sure):
  databaseURL: "https://chatapp-38b38-default-rtdb.firebaseio.com", 
  storageBucket: "chatapp-38b38.firebasestorage.app",
  messagingSenderId: "249017632366",
  appId: "1:249017632366:web:23c7b606798bc66cc4487f",
  measurementId: "G-BM7LDDX0G7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and Export Services
export const auth = getAuth(app);
export const database = getDatabase(app);