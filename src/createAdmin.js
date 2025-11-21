import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const createAdminUser = async () => {
  const adminEmail = "admin@vexetot.com";
  const adminPassword = "admin123456";  // Remember to change this in production

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail,
      adminPassword
    );

    const uid = userCredential.user.uid;
    
    // Create admin document in Firestore
    await setDoc(doc(db, "users", uid), {
      email: adminEmail,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    console.log("Admin account created successfully");
    return uid;
  } catch (error) {
    console.error("Error creating admin account:", error.message);
    throw error;
  }
};

// Execute the function
createAdminUser()
  .then(uid => console.log("Admin created with UID:", uid))
  .catch(error => console.log("Failed to create admin:", error)); 