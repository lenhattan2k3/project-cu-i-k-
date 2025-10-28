// Replace the placeholder values with your Firebase project's config
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions"; // ✅ thêm dòng này
const firebaseConfig = {
  apiKey: "AIzaSyCkPGe2Mv4lblA2WLj_ONkNN1ZJdwrPKts",
  authDomain: "vexetot-72d39.firebaseapp.com",
  projectId: "vexetot-72d39",
  storageBucket: "vexetot-72d39.firebasestorage.app",
  messagingSenderId: "757257647229",
  appId: "1:757257647229:web:165e70808536fbc145ed14",
  measurementId: "G-SRENHDMTEE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // ✅ thêm dòng này