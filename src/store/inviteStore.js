// store/inviteStore.js
import {
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Create a new invite code for a family.
 * Now also records who created it.
 * @param {{ familyId: string, ownerId: string }} ctx
 * @param {{ invitedEmail?: string, expiresAt?: number }} options
 * @returns {Promise<string>} inviteId
 */
export const createInvite = async (
  { familyId, ownerId },
  { invitedEmail, expiresAt } = {}
) => {
  if (!familyId) throw new Error("Family ID is required to create an invite");
  if (!ownerId) throw new Error("Owner ID is required to create an invite");

  const invitesCol = collection(db, "invites");
  const inviteData = {
    familyId,
    createdBy: ownerId,          // <— new
    createdAt: serverTimestamp(),
    used: false,
    ...(invitedEmail && { invitedEmail: invitedEmail.toLowerCase() }),
    ...(expiresAt && { expiresAt }),
  };
  const docRef = await addDoc(invitesCol, inviteData);
  return docRef.id;
};

/**
 * Fetch an invite by its code.
 * @param {string} inviteId
 * @returns {Promise<object>} invite data
 */
export const fetchInvite = async (inviteId) => {
  const ref = doc(db, "invites", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Invite not found");
  return { id: snap.id, ...snap.data() };
};

/**
 * Accept an invite: adds user to family and marks invite used.
 * @param {{ userId: string }} ctx
 * @param {string} inviteId
 * @returns {Promise<string>} familyId
 */
export const acceptInvite = async ({ userId }, inviteId) => {
  if (!userId) throw new Error("User must be logged in to accept an invite");

  // 1) load invite doc
  const inviteRef = doc(db, "invites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");
  const invite = inviteSnap.data();

  if (invite.used) throw new Error("Invite code has already been used");
  if (invite.expiresAt && Date.now() > invite.expiresAt)
    throw new Error("Invite code has expired");

  const { familyId } = invite;

  // 2) assign user to family on their account doc
  const accountRef = doc(db, "users", userId);
  await updateDoc(accountRef, {
    familyId,
    lastUsedMode: "family",
  });

  // 3) mark invite used
  await updateDoc(inviteRef, {
    used: true,
    usedBy: userId,
    usedAt: serverTimestamp(),
  });

  return familyId;
};

/**
 * Revoke (or delete) an invite code.
 * @param {{ userId:string, inviteId: string }} ctx
 * @returns {Promise<void>}
 */
export const revokeInvite = async ({ userId, inviteId }) => {
  // just delete the invite doc (we no longer clear account here)
  const inviteRef = doc(db, "invites", inviteId);
  await deleteDoc(inviteRef);
};

/**
 * Let a member leave their family.
 * - Removes `userId` from families/{familyId}.members
 * - Clears their own account.familyId & account.lastUsedMode
 */
export async function exitFamilyMembership({ userId, familyId }) {
  if (!userId || !familyId) {
    throw new Error("Must provide both userId and familyId");
  }

  // 1) remove from family doc
  const famRef = doc(db, "families", familyId);
  await updateDoc(famRef, {
    members: arrayRemove(userId),
  });

  // 2) clear the user’s account
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

/**
 * List all invites for a family.
 * @param {{ familyId: string }} ctx
 * @returns {Promise<Array<object>>}
 */
export const listInvites = async ({ familyId }) => {
  if (!familyId) throw new Error("Family ID is required to list invites");
  const invitesCol = collection(db, "invites");
  const q = query(invitesCol, where("familyId", "==", familyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
