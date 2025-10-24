
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2guuZbx-YhbrQD_-kEHCRlPyjcmVAiwE",
  authDomain: "reflecting-node-472213-h7.firebaseapp.com",
  projectId: "reflecting-node-472213-h7",
  storageBucket: "studio-7502195980-3983c.appspot.com",
  messagingSenderId: "569130702994",
  appId: "1:569130702994:web:47f5c0b95cdb9369e2ee4b"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
