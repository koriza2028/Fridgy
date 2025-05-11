import create from 'zustand';
import { fetchMealPlanForDate } from './mealPlannerStore';
import { fetchEnrichedRecipes } from './cookingStore';
import { fetchAvailableProducts } from './fridgeStore';

const useNotificationsStore = create((set, get) => ({
  groupedMissingIngredients: {}, // { date: { recipeId: { title, ingredients[] } } }
  totalMissingCount: 0,
  loading: false,

  fetchNotifications: async (userId) => {
    if (!userId) return;

    set({ loading: true });
    try {
      const [recipes, fridge] = await Promise.all([
        fetchEnrichedRecipes(userId),
        fetchAvailableProducts(userId),
      ]);

      const fridgeProductIds = new Set(fridge.map((p) => p.id));
      const today = new Date();
      const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        return d.toISOString().split('T')[0];
      });

      const plans = await Promise.all(
        dates.map((date) =>
          fetchMealPlanForDate(userId, date).then((res) => ({ date, res }))
        )
      );

      const recipeMap = new Map(recipes.map((r) => [r.id, r]));
      const result = {};

      for (const { date, res } of plans) {
        const recipeGroups = {};

        (res.recipes || []).forEach((planned) => {
          const full = recipeMap.get(planned.id);
          if (!full) return;

          const missingIngredients = (full.mandatoryIngredients || []).filter(
            (ingredient) => !fridgeProductIds.has(ingredient.productId)
          );

          if (missingIngredients.length > 0) {
            recipeGroups[planned.id] = {
              title: full.title,
              ingredients: missingIngredients,
            };
          }
        });

        result[date] = recipeGroups;
      }

      const total = Object.values(result).reduce(
        (sum, recipeMap) =>
          sum +
          Object.values(recipeMap).reduce(
            (s, recipe) => s + recipe.ingredients.length,
            0
          ),
        0
      );

      set({
        groupedMissingIngredients: result,
        totalMissingCount: total,
      });
    } catch (error) {
      console.error('Notification fetch failed', error);
      set({ groupedMissingIngredients: {}, totalMissingCount: 0 });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useNotificationsStore;
