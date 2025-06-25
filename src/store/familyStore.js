import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import create from "zustand";

/**
 * Let a member leave their family.
 */
export async function exitFamilyMembership({ userId, familyId }) {
  if (!userId || !familyId) {
    throw new Error("Must provide both userId and familyId");
  }

  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error("Family not found");

  const familyData = famSnap.data();
  if (familyData.createdBy === userId) {
    throw new Error("Family owner cannot leave the family");
  }

  await updateDoc(famRef, {
    members: arrayRemove(userId),
  });

  const acctRef = doc(db, "users", userId);
  await updateDoc(acctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

/**
 * Owner removes a member from the family.
 */
export async function removeFamilyMember({ ownerId, familyId, memberId }) {
  if (!ownerId || !familyId || !memberId) {
    throw new Error("Must provide ownerId, familyId, and memberId");
  }

  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error("Family not found");

  const data = famSnap.data();
  if (data.createdBy !== ownerId) {
    throw new Error("Only the family owner can remove members");
  }

  await updateDoc(famRef, {
    members: arrayRemove(memberId),
  });

  const targetAcctRef = doc(db, "users", memberId);
  await updateDoc(targetAcctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

const useFamilyStore = create((set) => ({
  ownerId: null,
  familyMembers: [],

  setFamilyMembers: (members) => set({ familyMembers: members }),

  // Existing methods...
  clearOwnerId: () => set({ ownerId: null }),

  fetchOwnerId: async (userId) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) throw new Error("User not found");

    const data = userDoc.data();
    const familyId = data.familyId;

    if (!familyId) {
      set({ ownerId: null });
      return;
    }

    const famSnap = await getDoc(doc(db, "families", familyId));
    if (!famSnap.exists()) throw new Error("Family not found");

    const ownerId = famSnap.data().createdBy;
    set({ ownerId });
  },

  // For example, a method to fetch and update familyMembers:
  fetchFamilyMembers: async (familyId) => {
    const famRef = doc(db, "families", familyId);
    const famSnap = await getDoc(famRef);
    if (!famSnap.exists()) throw new Error("Family not found");

    const data = famSnap.data();
    const memberIds = Array.isArray(data.members) ? data.members : [];

    const memberDocs = await Promise.all(
      memberIds.map((id) => getDoc(doc(db, "users", id)))
    );

    const members = memberDocs
      .filter((snap) => snap.exists())
      .map((snap) => {
        const data = snap.data();
        return {
          userId: snap.id,
          email: data?.email || "unknown",
          username: data?.username || "unknown",
        };
      });

    set({ familyMembers: members });

    return members; // ← THIS is the missing line
  },
}));

export default useFamilyStore;
