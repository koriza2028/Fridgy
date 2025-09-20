// useFamilyStore.js
import create from 'zustand';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Family store with live premium subscription state
 * - subscribeFamilyPremium(familyId): listens to families/{id}.premiumUntil | premiumActive
 * - familyPremiumActive: boolean derived from premiumUntil > now || premiumActive === true
 * - familyPremiumUntil: milliseconds since epoch or null
 * - fetchOwnerId(familyId), fetchFamilyMembers(familyId, currentUserId)
 */
const useFamilyStore = create((set, get) => ({
  ownerId: null,
  familyMembers: [],

  // Premium state (from families/{id})
  familyPremiumActive: false,
  familyPremiumUntil: null,

  // Internal unsubscribe for the live family listener
  _unsubFamily: null,

  setFamilyMembers: (members) => set({ familyMembers: members }),
  clearOwnerId: () => set({ ownerId: null }),

  clearFamilyPremium: () => {
    const unsub = get()._unsubFamily;
    if (unsub) unsub();
    set({
      familyPremiumActive: false,
      familyPremiumUntil: null,
      _unsubFamily: null,
      // --- CHANGED: also clear identity lists so UI can't think a family still exists
      ownerId: null,
      familyMembers: [],
    });
  },

  /**
   * Live-subscribe to a family's premium status.
   * Expects families/{familyId} to have either:
   *  - premiumUntil: Firestore Timestamp or ms number
   *  - premiumActive: boolean
   */
  subscribeFamilyPremium: (familyId) => {
    const prev = get()._unsubFamily;
    if (prev) prev();

    if (!familyId) {
      set({
        familyPremiumActive: false,
        familyPremiumUntil: null,
        _unsubFamily: null,
        // --- CHANGED: also clear these to avoid stale "family present" signals
        ownerId: null,
        familyMembers: [],
      });
      return;
    }

    const ref = doc(db, 'families', familyId);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        set({
          familyPremiumActive: false,
          familyPremiumUntil: null,
          // --- CHANGED: keep identity in sync on non-existent family
          ownerId: null,
          familyMembers: [],
        });
        return;
      }
      const d = snap.data() || {};
      const now = Date.now();

      // premiumUntil may be a number or a Firestore Timestamp
      const untilMs =
        typeof d.premiumUntil === 'number'
          ? d.premiumUntil
          : d.premiumUntil?.toMillis?.() ?? 0;

      const active = (untilMs > now) || !!d.premiumActive;

      set({
        familyPremiumActive: active,
        familyPremiumUntil: untilMs || null,
      });
    });

    set({ _unsubFamily: unsub });
  },

  /**
   * One-off: ask backend to sync RC → families/{familyId} *now*.
   * Call this immediately after you assign/create familyId for the premium owner.
   * Requires the callable CF: `syncFamilyPremium`.
   */
  syncFamilyPremiumNow: async (familyIdArg) => {
    const state = get();
    // no-op if we don’t currently have a family
    if (!state || !state._unsubFamily) {
      // still allow calling even before subscribe; callable does not need it
    }
    set({ _syncingPremium: true });
    try {
      const fn = httpsCallable(getFunctions(undefined, "europe-west3"), "syncFamilyPremium");
      await fn({ familyId: familyIdArg || null });      
      set({ _lastSyncAt: Date.now() });
      // Optional: you already have a live listener; no extra fetch is required.
      // If you want, you can force re-subscribe by reading current familyId from your auth store.
    } catch (e) {
      console.warn('[Family] syncFamilyPremiumNow failed:', e?.message || e);
      throw e;
    } finally {
      set({ _syncingPremium: false });
    }
  },

  /**
   * Fetch and set the ownerId of the family.
   */
  fetchOwnerId: async (familyId) => {
    if (!familyId) {
      set({ ownerId: null });
      return;
    }

    const famSnap = await getDoc(doc(db, 'families', familyId));
    if (!famSnap.exists()) throw new Error('Family not found');

    const ownerId = famSnap.data().createdBy;
    set({ ownerId });
    return ownerId;
  },

  /**
   * Fetch family members (excluding the current user).
   * Returns [{ userId, email, username }]
   */
  fetchFamilyMembers: async (familyId, currentUserId) => {
    if (!familyId) {
      set({ familyMembers: [] });
      return [];
    }

    const famRef = doc(db, 'families', familyId);
    const famSnap = await getDoc(famRef);
    if (!famSnap.exists()) throw new Error('Family not found');

    const data = famSnap.data();
    const memberIds = Array.isArray(data.members) ? data.members : [];
    const ownerId = data.createdBy;

    const uniqueIds = Array.from(
      new Set([ownerId, ...memberIds].filter((id) => id && id !== currentUserId))
    );

    if (uniqueIds.length === 0) {
      set({ familyMembers: [] });
      return [];
    }

    // Batch fetch users/{id}
    const userRefs = uniqueIds.map((id) => doc(db, 'users', id));
    const docs = await Promise.all(userRefs.map(getDoc));

    const members = docs
      .filter((s) => s.exists())
      .map((s) => {
        const u = s.data();
        return {
          userId: s.id,
          email: u?.email || 'unknown',
          username: u?.username || 'unknown',
        };
      });

    set({ familyMembers: members });
    return members;
  },
}));

export default useFamilyStore;

/* ---------- Standalone helpers (actions on family docs) ---------- */

/**
 * Let a member leave their family.
 * Owner cannot leave.
 */
export async function exitFamilyMembership({ userId, familyId }) {
  if (!userId || !familyId) {
    throw new Error('Must provide both userId and familyId');
  }

  const famRef = doc(db, 'families', familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error('Family not found');

  const familyData = famSnap.data();
  if (familyData.createdBy === userId) {
    throw new Error('Family owner cannot leave the family');
  }

  // Remove member from family
  await updateDoc(famRef, {
    members: arrayRemove(userId),
  });

  // Update user doc to remove family association
  const acctRef = doc(db, 'users', userId);
  await updateDoc(acctRef, {
    familyId: null,
    lastUsedMode: 'personal',
  });
}

/**
 * Owner removes a member from the family.
 * Owner cannot remove themselves (special-case handled).
 * Only owner can remove other members.
 */
export async function removeFamilyMember({ ownerId, familyId, memberId }) {
  if (!ownerId || !familyId || !memberId) {
    throw new Error('Must provide ownerId, familyId, and memberId');
  }

  const famRef = doc(db, 'families', familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error('Family not found');

  const data = famSnap.data();
  const creatorId = data.createdBy;

  if (ownerId === memberId) {
    // Owner removing themselves == leave family (allowed here)
    await updateDoc(famRef, { members: arrayRemove(memberId) });
    const acctRef = doc(db, 'users', memberId);
    await updateDoc(acctRef, { familyId: null, lastUsedMode: 'personal' });
    return;
  }

  if (ownerId !== creatorId) {
    throw new Error('Only the family owner can remove other members');
  }

  if (memberId === creatorId) {
    throw new Error('Owner cannot remove themselves');
  }

  await updateDoc(famRef, { members: arrayRemove(memberId) });
  const acctRef = doc(db, 'users', memberId);
  await updateDoc(acctRef, { familyId: null, lastUsedMode: 'personal' });
}

/**
 * Delete the family (owner only).
 * Resets all members’ familyId/lastUsedMode and deletes families/{familyId}.
 */
export async function deleteFamilyIfOwner({ familyId, requesterId }) {
  if (!familyId || !requesterId) {
    throw new Error('Missing familyId or requesterId');
  }

  const famRef = doc(db, 'families', familyId);
  const famSnap = await getDoc(famRef);
  if (!famSnap.exists()) throw new Error('Family not found');

  const familyData = famSnap.data();
  if (familyData.createdBy !== requesterId) {
    throw new Error('Only the family owner can delete the family');
  }

  const batch = writeBatch(db);

  const memberIds = Array.isArray(familyData.members) ? familyData.members : [];
  memberIds.forEach((uid) => {
    const userRef = doc(db, 'users', uid);
    batch.update(userRef, { familyId: null, lastUsedMode: 'personal' });
  });

  const ownerRef = doc(db, 'users', requesterId);
  batch.update(ownerRef, {
    familyId: null,
    lastUsedMode: 'personal',
    // If you track a list of families on the user doc, clean it:
    // families: arrayRemove(familyId),
  });

  batch.delete(famRef);
  await batch.commit();
}
