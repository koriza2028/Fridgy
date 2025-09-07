// authStore.js
import create from 'zustand';
import { onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

import Purchases from 'react-native-purchases';

import { deleteUserAccount } from './userAccountStore';
import useFamilyStore from './familyStore';
import { usePremiumStore } from './premiumStore';

const useAuthStore = create((set, get) => ({
  user: undefined,          // undefined while booting, null after logout, FirebaseUser object when logged in
  email: null,
  familyId: null,
  lastUsedMode: 'personal',
  unsubscribeUserDoc: null, // Firestore user doc listener cleanup

  setUser: (user) => set({ user }),
  setFamilyId: (familyId) => set({ familyId }),
  setLastUsedMode: (mode) => set({ lastUsedMode: mode }),
  setUnsubscribeUserDoc: (fn) => set({ unsubscribeUserDoc: fn }),

  /**
   * Local logout (clears Zustand fields).
   * Does NOT call Firebase signOut on its own; use doSignOut() below for full logout.
   */
  logout: () => {
    set({ user: null, email: null, familyId: null, lastUsedMode: 'personal' });
    // Also clear family premium & RC listeners locally
    try { useFamilyStore.getState().clearFamilyPremium(); } catch {}
    try { usePremiumStore.getState().cleanup(); } catch {}
  },

  /**
   * Full sign-out flow:
   * - Firebase signOut
   * - RevenueCat logOut
   * - Clear local stores
   */
  doSignOut: async () => {
    const { unsubscribeUserDoc } = get();
    if (unsubscribeUserDoc) {
      try { unsubscribeUserDoc(); } catch {}
      set({ unsubscribeUserDoc: null });
    }

    try { await signOut(auth); } catch {}

    try { await Purchases.logOut(); } catch {}

    // Premium listener + family premium cleanup
    try { usePremiumStore.getState().cleanup(); } catch {}
    try { useFamilyStore.getState().clearFamilyPremium(); } catch {}

    set({ user: null, email: null, familyId: null, lastUsedMode: 'personal' });
  },

  /**
   * Delete account end-to-end:
   * - Ensure Firestore cleanup (blocks if family owner)
   * - Delete Firebase Auth user (reauth may be required)
   * - RC logOut & local cleanup
   */
  deleteAccount: async () => {
    const { user, unsubscribeUserDoc } = get();
    if (!user) throw new Error('No authenticated user');
    const uid = user.uid;

    if (unsubscribeUserDoc) {
      try { unsubscribeUserDoc(); } catch {}
      set({ unsubscribeUserDoc: null });
    }

    // 1) delete Firestore data (may throw if family owner)
    await deleteUserAccount({ userId: uid });

    // 2) delete Auth user
    const current = auth.currentUser;
    if (current) {
      try {
        await deleteUser(current);
      } catch (e) {
        if (e?.code === 'auth/requires-recent-login') {
          throw new Error('Reauthentication required to complete account deletion. Please sign in again, then delete your account.');
        }
        throw e;
      }
    }

    // 3) best-effort signout + RC logout + local cleanup
    try { await Purchases.logOut(); } catch {}
    try { await signOut(auth); } catch {}
    try { usePremiumStore.getState().cleanup(); } catch {}
    try { useFamilyStore.getState().clearFamilyPremium(); } catch {}

    set({ user: null, email: null, familyId: null, lastUsedMode: 'personal' });
  },
}));

export default useAuthStore;

/* ---------------- Firebase Auth binding & side-effects ---------------- */

// Single global auth listener (module-level)
onAuthStateChanged(auth, async (fbUser) => {
  console.log('🔥 Firebase auth state changed:', fbUser?.uid ?? null);

  // Tear down previous user doc listener (if any)
  const prevUnsub = useAuthStore.getState().unsubscribeUserDoc;
  if (prevUnsub) {
    try { prevUnsub(); } catch {}
    useAuthStore.setState({ unsubscribeUserDoc: null });
  }

  if (fbUser) {
    // 1) Set local user
    useAuthStore.setState({ user: fbUser });

    // 2) RevenueCat login with custom appUserID (recommended when you have your own auth)
    try {
      await Purchases.logIn(fbUser.uid);
    } catch (e) {
      console.warn('[RC] logIn failed (non-fatal):', e?.message || e);
    }

    // 3) Start RC listeners (once per session)
    try {
      await usePremiumStore.getState().initPremiumListeners({ doInitialRefresh: true });
    } catch (e) {
      console.warn('[Premium] init listeners failed:', e?.message || e);
    }

    // 4) Subscribe to the user doc for email/family/mode & wire family premium + RC attributes
    const userDocRef = doc(db, 'users', fbUser.uid);
    const unsubscribe = onSnapshot(userDocRef, async (snap) => {
      const exists = snap.exists();
      const data = exists ? (snap.data() || {}) : {};

      console.log('📄 Firestore user snapshot:', exists, data);

      useAuthStore.setState({
        email: data.email ?? null,
        familyId: data.familyId ?? null,
        lastUsedMode: data.lastUsedMode ?? 'personal',
      });

      // Live-subscribe to the family's premium status
      try {
        useFamilyStore.getState().subscribeFamilyPremium(data.familyId ?? null);
        console.log('👪 Subscribed to family premium for', data.familyId ?? 'no family');
      } catch (e) {
        console.warn('[Family] subscribeFamilyPremium failed:', e?.message || e);
      }

      // Keep RC subscriber attributes in sync (handy for webhooks & support)
      try {
        await Purchases.setAttributes({
          rc_familyId: data.familyId ?? 'none',
          rc_userId: fbUser.uid,
          rc_lastUsedMode: String(data.lastUsedMode ?? 'personal'),
          rc_email: data.email ?? '',
        });
      } catch (e) {
        console.warn('[RC] setAttributes failed:', e?.message || e);
      }
    });

    useAuthStore.setState({ unsubscribeUserDoc: unsubscribe });
  } else {
    // Signed out
    try { usePremiumStore.getState().cleanup(); } catch {}
    try { useFamilyStore.getState().clearFamilyPremium(); } catch {}
    try { await Purchases.logOut(); } catch {}

    useAuthStore.setState({
      user: null,
      email: null,
      familyId: null,
      lastUsedMode: 'personal',
      unsubscribeUserDoc: null,
    });
  }
});
