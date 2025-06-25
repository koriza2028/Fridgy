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
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Helper: Get a user's username by ID
 */
const getUsernameById = async (userId) => {
  const userSnap = await getDoc(doc(db, "users", userId));
  return userSnap.exists() ? userSnap.data().username || null : null;
};

/**
 * Create a new invite code for a family.
 * Stores who created it, and optionally caches creator’s username.
 */
export const createInvite = async (
  { familyId, ownerId },
  { invitedEmail, expiresAt } = {}
) => {
  if (!familyId) throw new Error("Family ID is required to create an invite");
  if (!ownerId) throw new Error("Owner ID is required to create an invite");

  const invitesCol = collection(db, "invites");

  // Optional: cache username in the invite
  const createdByUsername = await getUsernameById(ownerId);

  const inviteData = {
    familyId,
    createdBy: ownerId,
    createdByUsername: createdByUsername || null,
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
 */
export const fetchInvite = async (inviteId) => {
  const ref = doc(db, "invites", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Invite not found");
  return { id: snap.id, ...snap.data() };
};

/**
 * Accept an invite: adds user to family and marks invite used.
 * Also optionally stores the username of the user who used it.
 */
export const acceptInvite = async ({ userId }, inviteId) => {
  if (!userId) throw new Error("User must be logged in to accept an invite");

  const inviteRef = doc(db, "invites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const invite = inviteSnap.data();

  if (invite.used) throw new Error("Invite code has already been used");
  if (invite.expiresAt && Date.now() > invite.expiresAt)
    throw new Error("Invite code has expired");

  const { familyId } = invite;

  // Assign user to family
  const accountRef = doc(db, "users", userId);
  await updateDoc(accountRef, {
    familyId,
    lastUsedMode: "family",
  });

  // Optional: get username of the user accepting the invite
  const usedByUsername = await getUsernameById(userId);

  // Mark invite used
  await updateDoc(inviteRef, {
    used: true,
    usedBy: userId,
    usedByUsername: usedByUsername || null,
    usedAt: serverTimestamp(),
  });

  return familyId;
};

/**
 * Revoke (delete) an invite.
 */
export const revokeInvite = async ({ userId, inviteId }) => {
  const inviteRef = doc(db, "invites", inviteId);
  await deleteDoc(inviteRef);
};

/**
 * List all invites for a family.
 */
export const listInvites = async ({ familyId }) => {
  if (!familyId) throw new Error("Family ID is required to list invites");
  const invitesCol = collection(db, "invites");
  const q = query(invitesCol, where("familyId", "==", familyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Enhanced: List invites and enrich with current usernames (not cached)
 */
export const listInvitesWithUsernames = async ({ familyId }) => {
  const invites = await listInvites({ familyId });

  const enriched = await Promise.all(
    invites.map(async (inv) => {
      const createdByUsername =
        inv.createdByUsername || (inv.createdBy && (await getUsernameById(inv.createdBy)));
      const usedByUsername =
        inv.usedByUsername || (inv.usedBy && (await getUsernameById(inv.usedBy)));

      return {
        ...inv,
        createdByUsername: createdByUsername || null,
        usedByUsername: usedByUsername || null,
      };
    })
  );

  return enriched;
};
