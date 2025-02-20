// In your Zustand store (authStore.js)
import create from 'zustand';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from "../firebaseConfig";

const useAuthStore = create((set) => {
  const auth = getAuth(app);
  onAuthStateChanged(auth, (user) => {
    set({ user });
  });
  return {
    user: undefined, // Start as undefined to denote loading
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
  };
});

export default useAuthStore;

