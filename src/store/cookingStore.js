import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust path as needed

/**
 * Helper function to merge duplicate ingredient entries.
 * Ingredients are keyed by originalFridgeId (if available) or their id.
 * Duplicate entries will have their amount summed.
 * @param {Array<object>} ingredients
 * @returns {Array<object>} Merged ingredients array.
 */
const mergeIngredients = (ingredients = []) => {
  const merged = {};
  ingredients.forEach(ingredient => {
    // Use originalFridgeId if available, otherwise the ingredient's id.
    const key = ingredient.originalFridgeId ? ingredient.originalFridgeId : ingredient.id;
    if (merged[key]) {
      merged[key].amount += ingredient.amount || 1;
    } else {
      merged[key] = { ...ingredient, amount: ingredient.amount || 1 };
    }
  });
  return Object.values(merged);
};

/**
 * Fetch the user's recipes from Firestore.
 * If the user document or the cooking field doesn't exist, create one with an empty recipes array.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} An object with a recipes array.
 */
export const fetchUserRecipes = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  let userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    const newUserData = {
      basket: { products: [] },
      fridge: { products: [] },
      cooking: { recipes: [] }
    };
    await setDoc(userDocRef, newUserData);
    return { recipes: [] };
  }
  const userData = userSnap.data();
  if (!userData.cooking) {
    await updateDoc(userDocRef, { "cooking.recipes": [] });
    return { recipes: [] };
  }
  return userData.cooking;
};

/**
 * Add a new recipe or update an existing one.
 * If the recipe already has an id and is found in the recipes array, it is updated.
 * Otherwise, a new recipe is added with a generated unique id.
 * Ingredient arrays (e.g. mandatoryIngredients, optionalIngredients) are merged to avoid duplicates.
 * @param {string} userId - The ID of the user.
 * @param {object} recipe - The recipe object. Should include an id if updating.
 * @returns {Promise<object>} An object with the updated recipes array.
 */
export const addOrUpdateRecipe = async (userId, recipe) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    let userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      const newUserData = {
        basket: { products: [] },
        fridge: { products: [] },
        cooking: { recipes: [] }
      };
      await setDoc(userDocRef, newUserData);
      userDoc = await transaction.get(userDocRef);
    }
    const userData = userDoc.data();
    const cooking = userData.cooking || { recipes: [] };

    // Merge duplicate ingredients if provided.
    if (recipe.mandatoryIngredients) {
      recipe.mandatoryIngredients = mergeIngredients(recipe.mandatoryIngredients);
    }
    if (recipe.optionalIngredients) {
      recipe.optionalIngredients = mergeIngredients(recipe.optionalIngredients);
    }

    if (recipe.id) {
      // Check if the recipe exists (by id)
      const index = cooking.recipes.findIndex(r => r.id === recipe.id);
      if (index !== -1) {
        cooking.recipes[index] = { ...cooking.recipes[index], ...recipe };
      } else {
        cooking.recipes.push(recipe);
      }
    } else {
      // Generate a new id for the recipe and add it
      recipe.id = Date.now().toString();
      cooking.recipes.push(recipe);
    }
    transaction.update(userDocRef, { "cooking.recipes": cooking.recipes });
    return { recipes: cooking.recipes };
  });
};

/**
 * Update an existing recipe.
 * Ingredient arrays in the updated recipe are merged to avoid duplicates.
 * @param {string} userId - The ID of the user.
 * @param {string} recipeId - The id of the recipe to update.
 * @param {object} updatedRecipe - The updated recipe fields.
 * @returns {Promise<object>} An object with the updated recipes array.
 */
export const updateRecipe = async (userId, recipeId, updatedRecipe) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");
    const userData = userDoc.data();
    const cooking = userData.cooking || { recipes: [] };

    // Merge ingredients if provided.
    if (updatedRecipe.mandatoryIngredients) {
      updatedRecipe.mandatoryIngredients = mergeIngredients(updatedRecipe.mandatoryIngredients);
    }
    if (updatedRecipe.optionalIngredients) {
      updatedRecipe.optionalIngredients = mergeIngredients(updatedRecipe.optionalIngredients);
    }

    const index = cooking.recipes.findIndex(r => r.id === recipeId);
    if (index === -1) throw new Error("Recipe not found");
    cooking.recipes[index] = { ...cooking.recipes[index], ...updatedRecipe };
    transaction.update(userDocRef, { "cooking.recipes": cooking.recipes });
    return { recipes: cooking.recipes };
  });
};

/**
 * Remove a recipe from the user's recipe book.
 * @param {string} userId - The ID of the user.
 * @param {string} recipeId - The id of the recipe to remove.
 * @returns {Promise<object>} An object with the updated recipes array.
 */
export const removeRecipe = async (userId, recipeId) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");
    const userData = userDoc.data();
    const cooking = userData.cooking || { recipes: [] };
    const updatedRecipes = cooking.recipes.filter(r => r.id !== recipeId);
    transaction.update(userDocRef, { "cooking.recipes": updatedRecipes });
    return { recipes: updatedRecipes };
  });
};

/**
 * Clear all recipes for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} An object with an empty recipes array.
 */
export const clearRecipes = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");
    transaction.update(userDocRef, { "cooking.recipes": [] });
    return { recipes: [] };
  });
};

/**
 * Move specific recipes (by their ids) out of the user's recipe book.
 * This function removes the selected recipes from the recipes array.
 * @param {string} userId - The ID of the user.
 * @param {Array<string>} recipeIds - An array of recipe ids to move.
 * @returns {Promise<object>} An object with the updated recipes array and the moved recipes.
 */
export const moveRecipes = async (userId, recipeIds) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");
    const userData = userDoc.data();
    const cooking = userData.cooking || { recipes: [] };
    const movedRecipes = cooking.recipes.filter(recipe =>
      recipeIds.includes(recipe.id)
    );
    const updatedRecipes = cooking.recipes.filter(recipe =>
      !recipeIds.includes(recipe.id)
    );
    transaction.update(userDocRef, { "cooking.recipes": updatedRecipes });
    return { recipes: updatedRecipes, movedRecipes };
  });
};
