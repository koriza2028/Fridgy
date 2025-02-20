import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration (Replace with your Firebase credentials)
const firebaseConfig = {
  apiKey: "AIzaSyCkEJMax82Nrt7JL9_iWhFxPw3u36B4JrM",
  authDomain: "fridgy-5cb04.firebaseapp.com",
  projectId: "fridgy-5cb04",
  storageBucket: "fridgy-5cb04.firebasestorage.app",
  messagingSenderId: "338150974075",
  appId: "1:338150974075:web:9377784c7da20eee09f8de",
  measurementId: "G-RPL6WCH2DR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with Persistent Local Cache
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    synchronizeTabs: true,
  }),
});

const storage = getStorage(app);

export { auth, db, storage };
