import create from 'zustand';
import { onAuthStateChanged, deleteUser, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { deleteUserAccount } from './userAccountStore';

const useAuthStore = create((set, get) => ({
  user: undefined,
  email: null,
  familyId: null,
  lastUsedMode: 'personal',
  unsubscribeUserDoc: null, // zum Abmelden des Listeners

  setUser: (user) => set({ user }),
  setFamilyId: (familyId) => set({ familyId }),
  setLastUsedMode: (mode) => set({ lastUsedMode: mode }),
  setUnsubscribeUserDoc: (fn) => set({ unsubscribeUserDoc: fn }),

  logout: () => set({ user: null, familyId: null, lastUsedMode: 'personal' }),

  // inside useAuthStore(...) actions
  deleteAccount: async () => {
    const { user, unsubscribeUserDoc } = get();
    if (!user) throw new Error('No authenticated user');
    const uid = user.uid;

    if (unsubscribeUserDoc) {
      unsubscribeUserDoc();
      set({ unsubscribeUserDoc: null });
    }

    // 1) delete Firestore data (blocks if family owner; removes from members if needed)
    await deleteUserAccount({ userId: uid });

    // 2) delete Auth user (no non-null assertion)
    const current = auth.currentUser;
    if (!current) {
      // already signed out or session invalidated — just clean local state
      set({ user: null, email: null, familyId: null, lastUsedMode: 'personal' });
      return;
    }

    try {
      await deleteUser(current);
    } catch (e) {
      if (e?.code === 'auth/requires-recent-login') {
        throw new Error('Reauthentication required to complete account deletion. Please sign in again, then delete your account.');
      }
      throw e;
    }

    try { await signOut(auth); } catch {}
    set({ user: null, email: null, familyId: null, lastUsedMode: 'personal' });
  },


}));

// Beobachte Firebase-Auth-Status
onAuthStateChanged(auth, async (user) => {
  console.log('🔥 Firebase auth state changed:', user);

  const unsubscribeOld = useAuthStore.getState().unsubscribeUserDoc;
  if (unsubscribeOld) {
    unsubscribeOld(); // alten Listener abmelden, falls vorhanden
  }

  if (user) {
    useAuthStore.setState({ user });

    // Setze Echtzeit-Listener auf das User-Dokument
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        console.log('Firestore user snapshot update:', docSnap.exists(), docSnap.data());

      if (docSnap.exists()) {
        const data = docSnap.data();
        useAuthStore.setState({
          email: data.email ?? null,
          familyId: data.familyId ?? null,
          lastUsedMode: data.lastUsedMode ?? 'personal',
        });
      }
    });

    useAuthStore.setState({ unsubscribeUserDoc: unsubscribe });
  } else {
    // kein User mehr angemeldet
    useAuthStore.setState({
      user: null,
      email: null,
      familyId: null,
      lastUsedMode: 'personal',
      unsubscribeUserDoc: null,
    });
  }
});

export default useAuthStore;
