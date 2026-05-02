// import firebase stuff here for auth
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "put key in!",
  authDomain: "stop-spare-a-dime.firebaseapp.com",
  projectId: "stop-spare-a-dime",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);