import create from 'zustand';

const useAuthStore = create((set) => ({
  user: null, // Initial state
  setUser: (user) => set({ user }), // Action to set the user
  logout: () => set({ user: null }), // Action to logout the user
}));

export default useAuthStore;
