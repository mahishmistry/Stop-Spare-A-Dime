import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  updatePassword
} from "firebase/auth"; // https://firebase.google.com/docs/reference/js/auth
 
const env = (import.meta as any).env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
 
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function signUp(email: string, password: string, name: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();  
  provider.setCustomParameters({ prompt: "select_account" });
  // Let Firebase open and manage its own popup. Issue was that firebase polls, 
  // and we should instead check if the popup has closed., 
  let signInDone = false; 
  let rejectEarly!: (err: any) => void;
  // function for if we close the google auth popup.
  const earlyClosePromise = new Promise<never>((_resolve, reject) => {
    rejectEarly = reject;
    const onFocus = () => { // popup closed.
      // wait 750ms in case it was a successful login and Firebase just needs time to resolve
      // if signInDone is still false after that, we know the user cancelled
      setTimeout(() => {
        if (!signInDone) {
          window.removeEventListener("focus", onFocus);
          const err: any = new Error("Popup closed by user");
          err.code = "auth/popup-closed-by-user";
          reject(err);
        }
      }, 500);
    };
    window.addEventListener("focus", onFocus, { once: true });
  });

  try {
    // race gets whatever promise finishes first
    const credential = await Promise.race([ // is what prevents the waiting polling:
      signInWithPopup(auth, provider), // if we login, reacts
      earlyClosePromise, // if we close, reacts 
    ]);
    signInDone = true; // once promise returns success
    return credential.user; // return the credentials
  } catch (err) {  // if rthe promise .race returned rejected, it goes to the catch case
    signInDone = true;
    throw err;
  }
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// subscribed to firebase auth state checking changes on login/logout. ensures state is synced correctly.
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
 
// auth token from firebase for user
export async function getToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
 
// Firebase Error Messages 
export function parseFirebaseError(code: string): string {
  const messages: Record<string, string> = {
    "auth/email-already-in-use":   "An account with this email already exists.", // signup with existing email
    "auth/invalid-email":          "Please enter a valid email address.", // bad email format, might go unused due to form formatting but safety 
    "auth/weak-password":          "Password must be at least 8 characters.", // password not correct minimum length
    "auth/invalid-credential":     "Invalid email or password.", // if password or email wrong or account doesnt exist
    "auth/too-many-requests":      "Too many attempts. Please try again later.", // in case overwhelming auth
    "auth/popup-closed-by-user":   "Google sign-in was cancelled.", // for popup closure. // manually used by us
    "auth/network-request-failed": "Network error. Check your connection.", // in case 
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}



//letting people change their passwords for connecting account settings - ava
export async function updateUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No user is logged in");
  
  await updatePassword(user, newPassword);
}