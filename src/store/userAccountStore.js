import { doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Ensure account document exists in users/ctx
 */
export const ensureUserAccount = async ({ userId }, email) => {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email,
      name: null,
      familyId: null,
      lastUsedMode: "personal",
    });
  }
};

/**
 * Get full user account info
 */
export const getUserAccount = async (ctx) => {
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
 * Create and assign familyId for the user (if not yet assigned)
 */
export const assignOrCreateFamily = async ({ userId }) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User account not found");

  let familyId = userSnap.data().familyId;

  // If no familyId, create new family doc and assign
  if (!familyId) {
    familyId = `fam-${Date.now().toString()}`;
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, {
      createdAt: Date.now(),
      createdBy: userId,
      members: [ctx.userId, ctx.familyId],
    });
    await updateDoc(userRef, { familyId });
  }

  await updateDoc(userRef, { lastUsedMode: "family" });
  return familyId;
};
// In userAccountStore.js
export const toggleUserMode = async ({ userId, currentMode }) => {
  const userRef = doc(db, "users", userId);

  if (currentMode === "family") {
    await updateDoc(userRef, { lastUsedMode: "personal" });
    return { mode: "personal", familyId: null };
  }

  // switch to family
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User account not found");

  let familyId = userSnap.data().familyId;
  if (!familyId) {
    familyId = `fam-${Date.now()}`;
    const familyRef = doc(db, "families", familyId);
    await setDoc(familyRef, {
      createdAt: Date.now(),
      createdBy: userId,
      members: [userId]
    });
    await updateDoc(userRef, { familyId });
  }

  await updateDoc(userRef, { lastUsedMode: "family" });
  return { mode: "family", familyId };
};

/**
 * Find the userAccounts doc for the given email and set its familyId.
 * Throws if no such user exists.
 */
export const addMemberByEmail = async ({ familyId }, email) => {
  if (!familyId) throw new Error("You must be in a family to add members.");

  // Query userAccounts collection for matching email
  const accountsRef = collection(db, "users");
  const q = query(accountsRef, where("email", "==", email.trim().toLowerCase()));
  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error(`No account found for '${email}'.`);
  }

  // Update each matching account (usually just one)
  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "userAccounts", d.id), { familyId })
    )
  );
};
