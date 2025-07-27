import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  deleteDoc, getDocs, collection, 
  query, where, writeBatch
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import create from "zustand";

/**
 * Let a member leave their family.
 * Owner cannot leave.
 */
export async function exitFamilyMembership(ctx) {
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

  // Remove member from family
  await updateDoc(famRef, {
    members: arrayRemove(userId),
  });

  // Update user doc to remove family association
  const acctRef = doc(db, "users", userId);
  await updateDoc(acctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

/**
 * Owner removes a member from the family.
 * Owner cannot remove themselves.
 * Only owner can remove members.
 */
export async function removeFamilyMember({ ownerId, familyId, memberId }) {
  if (!ownerId || !familyId || !memberId) {
    console.log(ownerId);
    console.log(familyId);
    console.log(memberId);
    throw new Error("Must provide ownerId, familyId, and memberId");
  }

  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error("Family not found");

  const data = famSnap.data();
  const creatorId = data.createdBy;

  if (ownerId === memberId) {
    // A user is trying to remove themselves
    await updateDoc(famRef, {
      members: arrayRemove(memberId),
    });

    const acctRef = doc(db, "users", memberId);
    await updateDoc(acctRef, {
      familyId: null,
      lastUsedMode: "personal",
    });

    return;
  }

  // A user is trying to remove someone else → must be the owner
  if (ownerId !== creatorId) {
    throw new Error("Only the family owner can remove other members");
  }

  if (memberId === creatorId) {
    throw new Error("Owner cannot remove themselves");
  }

  await updateDoc(famRef, {
    members: arrayRemove(memberId),
  });

  const acctRef = doc(db, "users", memberId);
  await updateDoc(acctRef, {
    familyId: null,
    lastUsedMode: "personal",
  });
}

export async function deleteFamilyIfOwner({ familyId, requesterId }) {
  if (!familyId || !requesterId) {
    throw new Error("Missing familyId or requesterId");
  }

  const famRef = doc(db, "families", familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error("Family not found");

  const familyData = famSnap.data();

  if (familyData.createdBy !== requesterId) {
    throw new Error("Only the family owner can delete the family");
  }

  const batch = writeBatch(db);

  // Update all members (reset familyId + mode)
  const memberIds = Array.isArray(familyData.members) ? familyData.members : [];
  memberIds.forEach((uid) => {
    const userRef = doc(db, "users", uid);
    batch.update(userRef, {
      familyId: null,
      lastUsedMode: "personal",
    });
  });

  // Update owner separately
  const ownerRef = doc(db, "users", requesterId);
  batch.update(ownerRef, {
    familyId: null,
    lastUsedMode: "personal",
    families: arrayRemove(familyId), // optional — only if you use this field
  });

  // Delete family
  batch.delete(famRef);

  await batch.commit();
}

const useFamilyStore = create((set) => ({
  ownerId: null,
  familyMembers: [],

  setFamilyMembers: (members) => set({ familyMembers: members }),

  clearOwnerId: () => set({ ownerId: null }),

  /**
   * Fetch and set the ownerId of the family
   */
  fetchOwnerId: async (familyId) => {
    if (!familyId) {
      set({ ownerId: null });
      return;
    }

    const famSnap = await getDoc(doc(db, "families", familyId));
    if (!famSnap.exists()) throw new Error("Family not found");

    const ownerId = famSnap.data().createdBy;
    set({ ownerId });
  },

  /**
   * Fetch family members excluding the current user.
   * @param {string} familyId
   * @param {string} currentUserId
   */
  fetchFamilyMembers: async (familyId, currentUserId) => {
    console.log("I AM", currentUserId);
    const famRef = doc(db, "families", familyId);
    const famSnap = await getDoc(famRef);
    if (!famSnap.exists()) throw new Error("Family not found");

    const data = famSnap.data();
    const memberIds = Array.isArray(data.members) ? data.members : [];
    const ownerId = data.createdBy;

    // Combine member IDs and owner ID, removing duplicates and current user
    const uniqueIds = Array.from(
      new Set([ownerId, ...memberIds].filter((id) => id !== currentUserId))
    );

    // Fetch user documents
    const memberDocs = await Promise.all(
      uniqueIds.map((id) => getDoc(doc(db, "users", id)))
    );

    // Format user data
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

    return members;
  },

}));

export default useFamilyStore;
