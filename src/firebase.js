import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLCYpRwMTGdaAsl4PgX5VF6VhgxwBXLVQ",
  authDomain: "radiology-clinic-5ba38.firebaseapp.com",
  projectId: "radiology-clinic-5ba38",
  storageBucket: "radiology-clinic-5ba38.firebasestorage.app",
  messagingSenderId: "761346246881",
  appId: "1:761346246881:web:b6766f06a33c2558e64fa0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
