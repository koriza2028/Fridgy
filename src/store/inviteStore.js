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

/** Accept an invite: join family, mark invite used, best-effort RC sync */
export const acceptInvite = async ({ userId }, inviteId) => {
  if (!userId) throw new Error("User must be logged in to accept an invite");

  const inviteRef = doc(db, "invites", inviteId);
  const inviteSnap = await getDoc(inviteRef);
  if (!inviteSnap.exists()) throw new Error("Invite not found");

  const invite = inviteSnap.data();

  if (invite.used) throw new Error("Invite code has already been used");
  if (invite.expiresAt && Date.now() > invite.expiresAt) {
    throw new Error("Invite code has expired");
  }

  const { familyId } = invite;

  // 1) Assign user to family (create-or-merge user doc)
  await setDoc(
    doc(db, "users", userId),
    { familyId, lastUsedMode: "family" },
    { merge: true }
  );

  // 2) Add user to family's members
  await updateDoc(doc(db, "families", familyId), {
    members: arrayUnion(userId),
  });

  // 3) Mark invite as used (optionally cache username)
  const usedByUsername = await getUsernameById(userId);
  await updateDoc(inviteRef, {
    used: true,
    usedBy: userId,
    usedByUsername: usedByUsername || null,
    usedAt: serverTimestamp(),
  });

  // 4) Best-effort manual sync (don’t block UX if it fails)
  try {
    const familySnap = await getDoc(doc(db, 'families', familyId));
    console.log("i am here", familySnap);
    await useFamilyStore.getState().syncFamilyPremiumNow?.(familyId);
  } catch (e) {
    if (__DEV__) console.log("[Invite] premium sync skipped:", e?.message);
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
