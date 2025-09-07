import {
  doc,
  addDoc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import useFamilyStore from "./familyStore";

/** Helper: fetch a user's username by id */
const getUsernameById = async (userId) => {
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data().username || null : null;
};

/** Create a new invite for a family */
export const createInvite = async (
  { familyId, ownerId },
  { invitedEmail, expiresAt } = {}
) => {
  if (!familyId) throw new Error("Family ID is required to create an invite");
  if (!ownerId) throw new Error("Owner ID is required to create an invite");

  const createdByUsername = await getUsernameById(ownerId);
  const inviteData = {
    familyId,
    createdBy: ownerId,
    createdByUsername: createdByUsername || null,
    createdAt: serverTimestamp(),
    used: false,
    ...(invitedEmail && { invitedEmail: invitedEmail.toLowerCase() }),
    ...(expiresAt && { expiresAt }), // number or Firestore Timestamp you pass in
  };

  const ref = await addDoc(collection(db, "invites"), inviteData);
  return ref.id;
};

/** Read an invite */
export const fetchInvite = async (inviteId) => {
  const ref = doc(db, "invites", inviteId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Invite not found");
  return { id: snap.id, ...snap.data() };
};

// assumes you have this helper somewhere already
// const getUsernameById = async (userId) => { ... }

export const acceptInvite = async ({ userId }, inviteId) => {
  if (!userId) throw new Error("User must be logged in to accept an invite");
  if (!inviteId) throw new Error("Invite code is missing");

  // 1) Load invite
  const inviteRef = doc(db, "invites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const invite = inviteSnap.data();
  if (invite.used) throw new Error("Invite code has already been used");
  if (invite.expiresAt && Date.now() > invite.expiresAt) {
    throw new Error("Invite code has expired");
  }

  const { familyId } = invite;
  if (!familyId) throw new Error("Invite is missing familyId");

  // 2) Add member: write user doc + push into family.members
  await setDoc(
    doc(db, "users", userId),
    { familyId, lastUsedMode: "family" },
    { merge: true }
  );

  await updateDoc(doc(db, "families", familyId), {
    members: arrayUnion(userId),
  });

  // 3) Mark invite used (optionally cache username)
  try {
    const usedByUsername = await getUsernameById(userId);
    await updateDoc(inviteRef, {
      used: true,
      usedBy: userId,
      usedByUsername: usedByUsername || null,
      usedAt: serverTimestamp(),
    });
  } catch {
    // non-fatal for UX
  }

  // 4) Stabilize UX: pause the Family-Mode guard briefly, then trigger a sync
  try {
    // give Firestore + callable/webhook a few seconds to settle
    useFamilyStore.getState().pauseGuard?.(10000); // 10s grace
  } catch {}
  try {
    await useFamilyStore.getState().syncFamilyPremiumNow?.(familyId);
  } catch {
    // non-fatal; the live family listener will still flip on when the backend updates
  }

  return familyId;
};


/** Revoke (delete) an invite */
export const revokeInvite = async ({ inviteId }) => {
  await deleteDoc(doc(db, "invites", inviteId));
};

/** List invites for a family */
export const listInvites = async ({ familyId }) => {
  if (!familyId) throw new Error("Family ID is required to list invites");
  const q = query(collection(db, "invites"), where("familyId", "==", familyId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** List invites with live usernames (not just cached) */
export const listInvitesWithUsernames = async ({ familyId }) => {
  const invites = await listInvites({ familyId });
  const enriched = await Promise.all(
    invites.map(async (inv) => {
      const createdByUsername =
        inv.createdByUsername ||
        (inv.createdBy && (await getUsernameById(inv.createdBy)));
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
