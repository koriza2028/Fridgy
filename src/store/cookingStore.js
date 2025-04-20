import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { db, storage } from "../firebaseConfig";

/**
 * Helper to strip down ingredients to minimal Firestore-friendly object
 */
const cleanIngredients = (ingredients = []) =>
  ingredients.map(({ productId, amount, originalFridgeId }) => ({
    productId,
    amount,
    ...(originalFridgeId && { originalFridgeId })
  }));

/**
 * Fetch the user's recipes from the subcollection.
 * If the user doc doesn't exist, initialize basket and fridge.
 * @param {string} userId
 * @returns {Promise<{ recipes: Array<object> }>}
 */
export const fetchUserRecipes = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  // Ensure user document exists with basket & fridge
  if (!userSnap.exists()) {
    await setDoc(userDocRef, {
      basket: { products: [] },
      fridge: { products: [] }
    });
  }

  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);
  const recipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  return { recipes };
};

/**
 * Add a new recipe or update an existing one in the subcollection.
 * Handles image cleanup if imageUri changed.
 * @param {string} userId
 * @param {object} recipe
 * @returns Promise<{ recipes: Array<object> }>
 */
export const addOrUpdateRecipe = async (userId, recipe) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  let oldImageUri = null;
  const newImageUri = recipe.imageUri || null;
  let recipeId = recipe.id;

  // If updating, fetch old to clean up image
  if (recipeId) {
    const existingRef = doc(recipesRef, recipeId);
    const existingSnap = await getDoc(existingRef);
    if (existingSnap.exists()) {
      oldImageUri = existingSnap.data().imageUri;
    } else {
      recipeId = Date.now().toString();
    }
  } else {
    recipeId = Date.now().toString();
  }

  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  const cleanedRecipe = {
    ...recipe,
    id: recipeId,
    mandatoryIngredients: cleanIngredients(
      recipe.mandatoryIngredients || []
    ),
    optionalIngredients: cleanIngredients(
      recipe.optionalIngredients || []
    )
  };

  await setDoc(recipeRef, cleanedRecipe);

  // Delete old image if changed
  if (oldImageUri && newImageUri && oldImageUri !== newImageUri) {
    const oldRef = storageRef(storage, oldImageUri);
    try {
      await deleteObject(oldRef);
    } catch (err) {
      console.warn("Failed to delete old recipe image:", err);
    }
  }

  return await fetchUserRecipes(userId);
};

/**
 * Update fields of an existing recipe.
 * @param {string} userId
 * @param {string} recipeId
 * @param {object} updatedFields
 * @returns Promise<{ recipes: Array<object> }>
 */
export const updateRecipe = async (userId, recipeId, updatedFields) => {
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  const snap = await getDoc(recipeRef);
  if (!snap.exists()) throw new Error("Recipe not found");

  const oldImageUri = snap.data().imageUri;
  const newImageUri = updatedFields.imageUri || null;

  await updateDoc(recipeRef, updatedFields);

  if (oldImageUri && newImageUri && oldImageUri !== newImageUri) {
    const oldRef = storageRef(storage, oldImageUri);
    try {
      await deleteObject(oldRef);
    } catch (err) {
      console.warn("Failed to delete old recipe image:", err);
    }
  }

  return await fetchUserRecipes(userId);
};

/**
 * Remove a recipe by ID and delete its image.
 * @param {string} userId
 * @param {string} recipeId
 * @returns Promise<{ recipes: Array<object> }>
 */
export const removeRecipe = async (userId, recipeId) => {
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  const snap = await getDoc(recipeRef);
  if (!snap.exists()) throw new Error("Recipe not found");

  const imageUri = snap.data().imageUri;
  await deleteDoc(recipeRef);

  if (imageUri) {
    const imgRef = storageRef(storage, imageUri);
    try {
      await deleteObject(imgRef);
    } catch (err) {
      console.warn("Failed to delete recipe image:", err);
    }
  }

  return await fetchUserRecipes(userId);
};

/**
 * Delete all recipes in the user's recipes subcollection.
 * @param {string} userId
 * @returns Promise<{ recipes: Array<object> }>
 */
export const clearRecipes = async (userId) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
  return { recipes: [] };
};

/**
 * Move specified recipes out (delete) and return moved + remaining.
 * @param {string} userId
 * @param {Array<string>} recipeIds
 * @returns Promise<{ recipes: Array<object>, movedRecipes: Array<object> }>
 */
export const moveRecipes = async (userId, recipeIds) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);

  const movedRecipes = [];
  const remaining = [];

  await Promise.all(
    snapshot.docs.map(async (d) => {
      const data = { id: d.id, ...d.data() };
      if (recipeIds.includes(d.id)) {
        movedRecipes.push(data);
        await deleteDoc(d.ref);
      } else {
        remaining.push(data);
      }
    })
  );

  return { recipes: remaining, movedRecipes };
};

/**
 * Fetch recipes and enrich ingredients with full product data.
 * @param {string} userId
 * @returns Promise<Array<object>>
 */
export const fetchEnrichedRecipes = async (userId) => {
  const { recipes } = await fetchUserRecipes(userId);
  const enriched = await Promise.all(
    recipes.map(async (recipe) => {
      const enrichList = async (list = []) =>
        Promise.all(
          list.map(async (ing) => {
            const pid = ing.productId || ing.id;
            const prodRef = doc(db, "users", userId, "products", pid);
            const prodSnap = await getDoc(prodRef);
            if (prodSnap.exists()) {
              const pdata = prodSnap.data();
              return { ...pdata, productId: pid, amount: ing.amount };
            }
            return ing;
          })
        );
      return {
        ...recipe,
        mandatoryIngredients: await enrichList(recipe.mandatoryIngredients),
        optionalIngredients: await enrichList(recipe.optionalIngredients)
      };
    })
  );
  return enriched;
};
