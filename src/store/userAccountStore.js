import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Ensure account document exists in users/{userId}
 */
export const ensureUserAccount = async ({ userId }, email) => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: email.toLowerCase(),
      username: null,
      familyId: null,
      lastUsedMode: "personal",
    });
  }
};

/**
 * Get full user account info
 */
export const getUserAccount = async ({ userId }) => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Account info not found");
  return snap.data();
};

/**
 * Set the username for a user
 */
export const setUsername = async ({ userId }, username) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { username });
};

/**
 * Get the username of a user
 */
export const getUsername = async ({ userId }) => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("User not found");
  return snap.data().username;
};

/**
 * Update lastUsedMode ('personal' or 'family')
 */
export const setLastUsedMode = async ({ userId }, mode) => {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { lastUsedMode: mode });
};

/**
 * Create a new family (if needed) and assign it to this user
 */
export const assignOrCreateFamily = async ({ userId }) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User account not found");

  let familyId = userSnap.data().familyId;
  if (!familyId) {
    familyId = `fam-${Date.now()}`;
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, {
      createdAt: Date.now(),
      createdBy: userId,
      members: [userId],
    });
    await updateDoc(userRef, { familyId });
  }

  await updateDoc(userRef, { lastUsedMode: "family" });
  return familyId;
};

/**
 * Toggle between personal and family modes
 */
export const toggleUserMode = async ({ userId, currentMode }) => {
  const userRef = doc(db, "users", userId);

  if (currentMode === "family") {
    await updateDoc(userRef, { lastUsedMode: "personal" });
    return { mode: "personal", familyId: null };
  }

  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User account not found");

  let familyId = snap.data().familyId;
  if (!familyId) {
    familyId = `fam-${Date.now()}`;
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, {
      createdAt: Date.now(),
      createdBy: userId,
      members: [userId],
    });
    await updateDoc(userRef, { familyId });
  }

  await updateDoc(userRef, { lastUsedMode: "family" });
  return { mode: "family", familyId };
};
