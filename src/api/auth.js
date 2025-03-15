import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signOut } from "firebase/auth";

const signUp = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Signup error:", error.message);
  }
};

const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

const logout = async () => {
try {
    await signOut(auth);
    console.log("User logged out");
} catch (error) {
    console.error("Logout error:", error.message);
}
};