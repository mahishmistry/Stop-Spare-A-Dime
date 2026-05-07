// import firebase stuff here for auth
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "make sure u put this in",
  authDomain: "stop-spare-a-dime.firebaseapp.com",
  projectId: "stop-spare-a-dime",
  storageBucket: "stop-spare-a-dime.firebasestorage.app",
  messagingSenderId: "375761236980",
  appId: "1:375761236980"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);



