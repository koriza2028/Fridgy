import create from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const useAuthStore = create((set) => ({
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
