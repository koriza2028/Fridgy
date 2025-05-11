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

const cleanIngredients = (ingredients = []) =>
  ingredients.map(({ productId, amount, originalFridgeId }) => ({
    productId,
    amount,
    ...(originalFridgeId && { originalFridgeId })
  }));

export const fetchUserRecipes = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    await setDoc(userDocRef, { basket: { products: [] }, fridge: { products: [] } });
  }

  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);
  return { recipes: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) };
};

export const addOrUpdateRecipe = async (userId, recipe) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  const recipeId = recipe.id || Date.now().toString();
  const recipeRef = doc(recipesRef, recipeId);
  let oldImageUri = null;

  if (recipe.id) {
    const snap = await getDoc(recipeRef);
    if (snap.exists()) {
      oldImageUri = snap.data().imageUri;
    }
  }

  const newImageUri = recipe.imageUri || null;

  const cleanedRecipe = {
    ...recipe,
    id: recipeId,
    mandatoryIngredients: cleanIngredients(recipe.mandatoryIngredients || []),
    optionalIngredients: cleanIngredients(recipe.optionalIngredients || [])
  };

  await setDoc(recipeRef, cleanedRecipe);

  if (oldImageUri && newImageUri && oldImageUri !== newImageUri) {
    try { await deleteObject(storageRef(storage, oldImageUri)); } 
    catch (err) { console.warn("Failed to delete old recipe image:", err); }
  }

  return fetchUserRecipes(userId);
};

export const updateRecipe = async (userId, recipeId, updatedFields) => {
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  const snap = await getDoc(recipeRef);
  if (!snap.exists()) throw new Error("Recipe not found");

  const oldImageUri = snap.data().imageUri;
  const newImageUri = updatedFields.imageUri || null;

  await updateDoc(recipeRef, updatedFields);

  if (oldImageUri && newImageUri && oldImageUri !== newImageUri) {
    try { await deleteObject(storageRef(storage, oldImageUri)); }
    catch (err) { console.warn("Failed to delete old recipe image:", err); }
  }

  return fetchUserRecipes(userId);
};

export const removeRecipe = async (userId, recipeId) => {
  const recipeRef = doc(db, "users", userId, "recipes", recipeId);
  const snap = await getDoc(recipeRef);
  if (!snap.exists()) throw new Error("Recipe not found");

  const imageUri = snap.data().imageUri;
  await deleteDoc(recipeRef);

  if (imageUri) {
    try { await deleteObject(storageRef(storage, imageUri)); }
    catch (err) { console.warn("Failed to delete recipe image:", err); }
  }

  return fetchUserRecipes(userId);
};

export const clearRecipes = async (userId) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);

  await Promise.all(snapshot.docs.map(async (d) => {
    const data = d.data();
    if (data.imageUri) {
      try { await deleteObject(storageRef(storage, data.imageUri)); } 
      catch (err) { console.warn("Failed to delete recipe image:", err); }
    }
    await deleteDoc(d.ref);
  }));

  return { recipes: [] };
};

export const moveRecipes = async (userId, recipeIds) => {
  const recipesRef = collection(db, "users", userId, "recipes");
  const snapshot = await getDocs(recipesRef);

  const movedRecipes = [], remaining = [];

  await Promise.all(snapshot.docs.map(async (d) => {
    const data = { id: d.id, ...d.data() };
    if (recipeIds.includes(d.id)) {
      movedRecipes.push(data);
      if (data.imageUri) {
        try { await deleteObject(storageRef(storage, data.imageUri)); }
        catch (err) { console.warn("Failed to delete moved recipe image:", err); }
      }
      await deleteDoc(d.ref);
    } else {
      remaining.push(data);
    }
  }));

  return { recipes: remaining, movedRecipes };
};

export const fetchEnrichedRecipes = async (userId) => {
  const { recipes } = await fetchUserRecipes(userId);
  const enrichList = async (list = []) =>
    Promise.all(list.map(async (ing) => {
      const pid = ing.productId || ing.id;
      const prodRef = doc(db, "users", userId, "products", pid);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const pdata = prodSnap.data();
        return { ...pdata, productId: pid, amount: ing.amount };
      }
      return ing;
    }));

  return Promise.all(
    recipes.map(async (recipe) => ({
      ...recipe,
      mandatoryIngredients: await enrichList(recipe.mandatoryIngredients),
      optionalIngredients: await enrichList(recipe.optionalIngredients),
    }))
  );
};