// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCA5bS4RjO4g2Ersq55z6QpuKLoFmdfTJE",
  authDomain: "stop-spare-a-dime.firebaseapp.com",
  projectId: "stop-spare-a-dime",
  storageBucket: "stop-spare-a-dime.firebasestorage.app",
  messagingSenderId: "375761236980",
  appId: "1:375761236980:web:55ff4286cb22af5f12bfa1",
  measurementId: "G-T1TNNE9VRP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();