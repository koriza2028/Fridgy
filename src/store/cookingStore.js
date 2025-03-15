import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust path as needed

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

const cleanIngredients = (ingredients = []) =>
  ingredients.map(({ productId, amount, originalFridgeId }) => ({
    productId,
    amount,
    ...(originalFridgeId && { originalFridgeId }),
  }));

/**
 * Add a new recipe or update an existing one.
 * If the recipe already has an id and is found in the recipes array, it is updated.
 * Otherwise, a new recipe is added with a generated unique id.
 * Ingredients are stored as minimal references: each ingredient should have:
 *    - productId (or id) : reference to the fridge product,
 *    - amount : quantity used in the recipe,
 * @param {string} userId - The ID of the user.
 * @param {object} recipe - The recipe object.
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

    // Clean the ingredients so only the references are saved.
    if (recipe.mandatoryIngredients) {
      recipe.mandatoryIngredients = cleanIngredients(recipe.mandatoryIngredients);
    }
    if (recipe.optionalIngredients) {
      recipe.optionalIngredients = cleanIngredients(recipe.optionalIngredients);
    }

    if (recipe.id) {
      const index = cooking.recipes.findIndex(r => r.id === recipe.id);
      if (index !== -1) {
        cooking.recipes[index] = { ...cooking.recipes[index], ...recipe };
      } else {
        cooking.recipes.push(recipe);
      }
    } else {
      recipe.id = Date.now().toString();
      cooking.recipes.push(recipe);
    }
    transaction.update(userDocRef, { "cooking.recipes": cooking.recipes });
    return { recipes: cooking.recipes };
  });
};

/**
 * Update an existing recipe.
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

/**
 * NEW: Fetch enriched recipes.
 * For each recipe, this function enriches each ingredient (in mandatoryIngredients and optionalIngredients)
 * by fetching the corresponding full product details (like name and imageUri) from the "products" container.
 * In the recipe, ingredients are stored as references (with productId, amount).
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} An array of enriched recipes.
 */
export const fetchEnrichedRecipes = async (userId) => {
  const cooking = await fetchUserRecipes(userId);
  const recipes = cooking.recipes || [];
  const enrichedRecipes = await Promise.all(
    recipes.map(async (recipe) => {
      // Enrich mandatoryIngredients.
      const enrichedMandatory = recipe.mandatoryIngredients
        ? await Promise.all(
            recipe.mandatoryIngredients.map(async (ingredient) => {
              // Assume ingredient stores a product reference in productId.
              const productId = ingredient.productId || ingredient.id;
              const productDocRef = doc(db, "users", userId, "products", productId);
              const productSnap = await getDoc(productDocRef);
              if (productSnap.exists()) {
                const productData = productSnap.data();
                // Merge data so that ingredient's amount override productData.
                return { ...productData, productId, amount: ingredient.amount};
              }
              return ingredient;
            })
          )
        : [];
      // Enrich optionalIngredients.
      const enrichedOptional = recipe.optionalIngredients
        ? await Promise.all(
            recipe.optionalIngredients.map(async (ingredient) => {
              const productId = ingredient.productId || ingredient.id;
              const productDocRef = doc(db, "users", userId, "products", productId);
              const productSnap = await getDoc(productDocRef);
              if (productSnap.exists()) {
                const productData = productSnap.data();
                return { ...productData, productId, amount: ingredient.amount};
              }
              return ingredient;
            })
          )
        : [];
      return {
        ...recipe,
        mandatoryIngredients: enrichedMandatory,
        optionalIngredients: enrichedOptional,
      };
    })
  );
  return enrichedRecipes;
};
