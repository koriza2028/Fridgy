// store/userstore.js
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
      name: null,
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
    // generate a new family ID
    familyId = `fam-${Date.now()}`;
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, {
      createdAt: Date.now(),
      createdBy: userId,
      members: [userId],
    });
    await updateDoc(userRef, { familyId });
  }

  // switch into family mode
  await updateDoc(userRef, { lastUsedMode: "family" });
  return familyId;
};

/**
 * Toggle between personal and family modes
 */
export const toggleUserMode = async ({ userId, currentMode }) => {
  const userRef = doc(db, "users", userId);

  if (currentMode === "family") {
    // go back to personal
    await updateDoc(userRef, { lastUsedMode: "personal" });
    return { mode: "personal", familyId: null };
  }

  // else: switch into family
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User account not found");

  let familyId = snap.data().familyId;
  if (!familyId) {
    // create new family
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

/**
 * Find an existing users doc by email, and give them this familyId
 */
export const addMemberByEmail = async ({ familyId }, email) => {
  if (!familyId) throw new Error("Must be in family mode to add members");

  const accountsCol = collection(db, "users");
  const q = query(
    accountsCol,
    where("email", "==", email.trim().toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error(`No account found for "${email}"`);
  }

  // update each matching account
  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "users", d.id), { familyId })
    )
  );
};
