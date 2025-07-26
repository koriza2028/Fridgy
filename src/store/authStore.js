import create from 'zustand';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import app, { db } from '../firebaseConfig';

const useAuthStore = create((set) => {
  const auth = getAuth(app);

  // Watch for Firebase login state
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      const familyId = userSnap.exists() ? userSnap.data().familyId : null;
      const lastUsedMode = userSnap.exists() ? userSnap.data().lastUsedMode || 'personal' : 'personal';
      const email = userSnap.exists() ? userSnap.data().email : null;

      set({
        user,
        email,
        familyId,
        lastUsedMode,
      });
    } else {
      set({
        user: null,
        email: null,
        familyId: null,
        lastUsedMode: 'personal',
      });
    }
  });

  return {
    user: undefined, // undefined = loading, null = logged out
    email: null,
    familyId: null,
    lastUsedMode: 'personal',

    setUser: (user) => set({ user }),
    setFamilyId: (familyId) => set({ familyId }),
    setLastUsedMode: (mode) => set({ lastUsedMode: mode }),

    logout: () => set({ user: null, familyId: null, lastUsedMode: 'personal' }),
  };
});

export default useAuthStore;
