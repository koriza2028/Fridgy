import create from 'zustand';
import { fetchAvailableProducts, fetchArchivedProducts } from './fridgeStore';

const useProductStore = create((set) => ({
  available: [],
  archived: [],
  loading: false,

  refreshProducts: async (ctx) => {
    if (!ctx?.userId) return;
    set({ loading: true });
    try {
      const [available, archived] = await Promise.all([
        fetchAvailableProducts(ctx),
        fetchArchivedProducts(ctx),
      ]);
      set({ available, archived });
    } catch (err) {
      console.error('Failed to refresh products:', err);
    } finally {
      set({ loading: false });
    }
  },
}));

export default useProductStore;
