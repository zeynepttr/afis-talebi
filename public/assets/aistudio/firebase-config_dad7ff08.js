// ─────────────────────────────────────────────────────────────
// firebase-config.js  —  Firebase Yapılandırması
// ─────────────────────────────────────────────────────────────

import { initializeApp }             from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }                   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }              from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAPUgu_aj8QHe4IIlNGFqGpisd4YKK9n-A",
  authDomain:        "afis-talebi.firebaseapp.com",
  projectId:         "afis-talebi",
  storageBucket:     "afis-talebi.firebasestorage.app",
  messagingSenderId: "393506913176",
  appId:             "1:393506913176:web:a67db2216d42a1dd9009ed",
  measurementId:     "G-KWZJRV4DXB"
};

// Ana uygulama
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// İkincil uygulama — Admin kullanıcı oluştururken kendi oturumunu kaybetmemesi için
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

// Kullanıcı adını Firebase Auth e-postasına çeviren yardımcı
// Örn: "zeynep" → "zeynep@afisportali.internal"
export const DOMAIN  = "@afisportali.internal";
export const toEmail = (username) => username.toLowerCase().trim() + DOMAIN;
