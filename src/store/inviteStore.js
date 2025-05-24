import { doc, addDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Create a new invite code for a family.
 * @param {{familyId: string}} ctx
 * @param {{invitedEmail?: string, expiresAt?: number}} options
 * @returns {Promise<string>} inviteId
 */
export const createInvite = async ({ familyId }, { invitedEmail, expiresAt } = {}) => {
  if (!familyId) throw new Error("Family ID is required to create an invite");
  const invitesCol = collection(db, "invites");
  const inviteData = {
    familyId,
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
 * @param {{userId: string}} ctx
 * @param {string} inviteId
 * @returns {Promise<string>} familyId
 */
export const acceptInvite = async ({ userId }, inviteId) => {
  if (!userId) throw new Error("User must be logged in to accept an invite");
  const inviteRef = doc(db, "invites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");
  const invite = inviteSnap.data();
  if (invite.used) throw new Error("Invite code has already been used");
  if (invite.expiresAt && Date.now() > invite.expiresAt) throw new Error("Invite code has expired");

  const { familyId } = invite;
  // assign to userAccounts
  const accountRef = doc(db, "userAccounts", userId);
  await updateDoc(accountRef, {
    familyId,
    lastUsedMode: "family"
  });
  // mark invite used
  await updateDoc(inviteRef, {
    used: true,
    usedBy: userId,
    usedAt: serverTimestamp()
  });

  return familyId;
};

/**
 * Revoke (or delete) an invite code.
 * @param {string} inviteId
 * @returns {Promise<void>}
 */
export const revokeInvite = async (inviteId) => {
  const inviteRef = doc(db, "invites", inviteId);
  await deleteDoc(inviteRef);
};

/**
 * List all invites for a family.
 * @param {{familyId: string}} ctx
 * @returns {Promise<Array<object>>}
 */
export const listInvites = async ({ familyId }) => {
  if (!familyId) throw new Error("Family ID is required to list invites");
  const invitesCol = collection(db, "invites");
  const q = query(invitesCol, where("familyId", "==", familyId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
