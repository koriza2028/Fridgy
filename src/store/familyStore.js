// store/familyStore.js
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";
// stores/familyStore.js
import create from "zustand";
/**
 * Let a member leave their family.
 * - Removes `userId` from families/{familyId}.members
 * - Clears their own account.familyId & account.lastUsedMode
 */
export async function exitFamilyMembership({ userId, familyId }) {
  if (!userId || !familyId) {
    throw new Error("Must provide both userId and familyId");
  }

  // Fetch family document
  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);

  if (!famSnap.exists()) {
    throw new Error("Family not found");
  }

  const familyData = famSnap.data();

  // Prevent the owner from leaving the family
  if (familyData.createdBy === userId) {
    throw new Error("Family owner cannot leave the family");
  }

  // Remove user from the family
  await updateDoc(famRef, {
    members: arrayRemove(userId),
  });

  // Update user's document
  const acctRef = doc(db, "users", userId);
  await updateDoc(acctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

/**
 * Owner kicks a member out of the family.
 * - Verifies `ownerId` === families/{familyId}.createdBy
 * - Removes `memberId` from members[]
 * - Clears that member’s account.familyId & lastUsedMode
 */
export async function removeFamilyMember({ ownerId, familyId, memberId }) {
  if (!ownerId || !familyId || !memberId) {
    throw new Error("Must provide ownerId, familyId, and memberId");
  }

  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) {
    throw new Error("Family not found");
  }

  const data = famSnap.data();
  if (data.createdBy !== ownerId) {
    throw new Error("Only the family owner can remove members");
  }

  // 1) remove from the family doc
  await updateDoc(famRef, {
    members: arrayRemove(memberId),
  });

  // 2) clear the target user’s account
  const targetAcctRef = doc(db, "users", memberId);
  await updateDoc(targetAcctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

const useFamilyStore = create((set) => ({
  ownerId: null,

  fetchOwnerId: async (familyId) => {
    try {
      const famSnap = await getDoc(doc(db, 'families', familyId));
      if (famSnap.exists()) {
        const createdBy = famSnap.data().createdBy;
        set({ ownerId: createdBy });
        return createdBy;
      } else {
        set({ ownerId: null });
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch owner ID:', error);
      set({ ownerId: null });
      return null;
    }
  },

  clearOwnerId: () => set({ ownerId: null }),
}));

export default useFamilyStore;
