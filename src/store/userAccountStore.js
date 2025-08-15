import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayRemove,
  collection,
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

export const toggleUserMode = async ({ userId, lastUsedMode }) => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("User account not found");

  let familyId = snap.data().familyId;
  let shouldCreateNewFamily = false;

  if (lastUsedMode === "family") {
    await updateDoc(userRef, { lastUsedMode: "personal" });
    return { mode: "personal", familyId: familyId };
  }

  if (familyId) {
    const familyRef = doc(db, "families", familyId);
    const famSnap = await getDoc(familyRef);

    if (!famSnap.exists()) {
      shouldCreateNewFamily = true;
    } else {
      const familyData = famSnap.data();
      const isMember =
        Array.isArray(familyData.members) &&
        familyData.members.includes(userId);

      if (!isMember && familyData.createdBy === userId) {
        // Re-add user as member if they are the owner
        await updateDoc(familyRef, {
          members: [...(familyData.members || []), userId],
        });
      }

      if (!isMember && familyData.createdBy !== userId) {
        throw new Error("You are not a member of this family");
      }
    }
  } else {
    shouldCreateNewFamily = true;
  }

  if (shouldCreateNewFamily) {
    const newFamilyRef = await addDoc(collection(db, "families"), {
      createdAt: Date.now(),
      createdBy: userId,
      members: [],
      debugSource: "toggleUserMode", // Optional: helpful for tracking
    });

    familyId = newFamilyRef.id;

    await updateDoc(userRef, {
      familyId,
    });
  }

  await updateDoc(userRef, { lastUsedMode: "family" });
  return { mode: "family", familyId };
};

/**
 * Delete user account with single-family constraint:
 * - If user owns their family (families/{familyId}.createdBy === userId) → block
 * - If user is a member → remove from members[]
 * - Then delete users/{userId}
 */
export const deleteUserAccount = async ({ userId }) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User account not found");

  const { familyId } = userSnap.data() || {};

  if (familyId) {
    const familyRef = doc(db, "families", familyId);
    const familySnap = await getDoc(familyRef);

    if (familySnap.exists()) {
      const fam = familySnap.data();

      if (fam.createdBy === userId) {
        throw new Error(
          "Account deletion blocked: you are the family owner. Transfer ownership or delete the family first."
        );
      }

      // remove membership (no-op if not present)
      await updateDoc(familyRef, { members: arrayRemove(userId) });
    }
  }

  await deleteDoc(userRef);
  return { ok: true };
};
