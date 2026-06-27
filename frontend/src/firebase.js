import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcCRK23Z1SebJsistpNwLPbt96jGc9DxI",
  authDomain: "medsimplify-9c050.firebaseapp.com",
  projectId: "medsimplify-9c050",
  storageBucket: "medsimplify-9c050.firebasestorage.app",
  messagingSenderId: "179775782120",
  appId: "1:179775782120:web:6397bd9a68118aa2fa9d5d",
  measurementId: "G-FPW7ZFNS7Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
