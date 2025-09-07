import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import app, { db } from '../firebaseConfig';
import useAuthStore from './authStore';
import usePremiumStore from './premiumStore';

const auth = getAuth(app);

export function initAuthStore() {
  // Set loading = true when auth process starts
  useAuthStore.setState({ loading: true });

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      const familyId = userSnap.exists() ? userSnap.data().familyId : null;
      const lastUsedMode = userSnap.exists() ? userSnap.data().lastUsedMode : 'personal';
      const email = userSnap.exists() ? userSnap.data().email : null;

      useAuthStore.setState({
        user,
        email,
        familyId,
        lastUsedMode,
        loading: false,  // loading finished
      });
      await usePremiumStore.getState().initPremiumListeners({ doInitialRefresh: true });
    } else {
      useAuthStore.setState({
        user: null,
        email: null,
        familyId: null,
        lastUsedMode: 'personal',
        loading: false,  // loading finished
      });
    }
  });
}
