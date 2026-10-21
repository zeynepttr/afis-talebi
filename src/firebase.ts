import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type User as FirebaseUser 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  getDocs,
  type DocumentData
} from "firebase/firestore";
import {
  getDatabase,
  ref as rtdbRef,
  set as rtdbSet,
  get as rtdbGet,
  child as rtdbChild,
  push as rtdbPush,
  update as rtdbUpdate,
  onValue as rtdbOnValue,
  remove as rtdbRemove,
  type Database
} from "firebase/database";

export const RTDB_REGIONS = {
  US: "https://afis-talebi-default-rtdb.firebaseio.com",
  EUROPE: "https://afis-talebi-default-rtdb.europe-west1.firebasedatabase.app"
};

// Check if user previously saved a specific region URL
const savedRtdbUrl = typeof window !== 'undefined' ? localStorage.getItem('afis_rtdb_url') : null;
export const currentRtdbUrl = savedRtdbUrl || RTDB_REGIONS.US;

export const firebaseConfig = {
  apiKey:            "AIzaSyAPUgu_aj8QHe4IIlNGFqGpisd4YKK9n-A",
  authDomain:        "afis-talebi.firebaseapp.com",
  databaseURL:       currentRtdbUrl,
  projectId:         "afis-talebi",
  storageBucket:     "afis-talebi.firebasestorage.app",
  messagingSenderId: "393506913176",
  appId:             "1:393506913176:web:a67db2216d42a1dd9009ed",
  measurementId:     "G-KWZJRV4DXB"
};

// Initialize Primary Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app, currentRtdbUrl);

// Function to switch Realtime Database URL if needed
export function setDatabaseRegion(regionUrl: string) {
  try {
    localStorage.setItem('afis_rtdb_url', regionUrl);
    window.location.reload();
  } catch (e) {
    console.error("Failed to save DB region:", e);
  }
}

// Initialize Secondary Firebase App for creating users without signing out current admin
let secondaryAppInstance;
try {
  secondaryAppInstance = getApp("Secondary");
} catch {
  secondaryAppInstance = initializeApp(firebaseConfig, "Secondary");
}
export const secondaryAuth = getAuth(secondaryAppInstance);

export const DOMAIN = "@afisportali.internal";
export const toEmail = (username: string) => username.toLowerCase().trim() + DOMAIN;

/**
 * Timeout-wrapped getDoc to prevent infinite loading if Firestore is blocked or slow
 */
export async function safeGetDocWithTimeout(docRef: any, timeoutMs = 4500) {
  return Promise.race([
    getDoc(docRef),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), timeoutMs)
    )
  ]);
}

/**
 * Robust logout function that guarantees the user is signed out
 * and clears any stale local storage caches
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Sign out error (ignoring):", err);
  }
  try {
    localStorage.removeItem("afis_saved_username");
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }
}

/**
 * Emergency force reset function for when the user gets stuck
 */
export async function emergencyResetAuth() {
  try {
    await signOut(auth);
  } catch {}
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
}

export {
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  getDocs,
  // Realtime Database exports
  rtdbRef,
  rtdbSet,
  rtdbGet,
  rtdbChild,
  rtdbPush,
  rtdbUpdate,
  rtdbOnValue,
  rtdbRemove
};
export type { FirebaseUser, DocumentData, Database };
