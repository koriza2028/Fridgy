import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { fetchEnrichedRecipes } from "./cookingStore";

/**
 * Format a Date object or string (YYYY-MM-DD) into a Firestore doc ID.
 * Ensures consistency: use '2025-04-20' style strings.
 */
const formatDateId = (date) => {
  if (date instanceof Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  // assume already in 'YYYY-MM-DD'
  return date;
};

/**
 * Get reference to the mealPlanner subcollection for a user.
 * @param {string} userId
 */
const mealPlannerCollection = (userId) => collection(db, "users", userId, "mealPlanner");

/**
 * Fetch the meal-plan for a single date, returning enriched recipe objects.
 * @param {string} userId
 * @param {Date|string} date - Date instance or 'YYYY-MM-DD'
 * @returns {Promise<{ date: string, recipes: Array<object> }>}
 */
export const fetchMealPlanForDate = async (userId, date) => {
  const dateId = formatDateId(date);
  const docRef = doc(db, "users", userId, "mealPlanner", dateId);
  const snap = await getDoc(docRef);
  const recipeIds = snap.exists() ? snap.data().recipeIds || [] : [];
  
  // Fetch all enriched recipes, then filter by planned IDs
  const allRecipes = await fetchEnrichedRecipes(userId);
  const plannedRecipes = allRecipes.filter((r) => recipeIds.includes(r.id));

  return { date: dateId, recipes: plannedRecipes };
};

/**
 * Add a recipe ID to a specific date's meal plan.
 * If the date document doesn't exist, it will be created.
 * @param {string} userId
 * @param {Date|string} date
 * @param {string} recipeId
 * @returns {Promise<Array<string>>} Updated array of recipeIds for that date
 */
export const addRecipeToDate = async (userId, date, recipeId) => {
  const dateId = formatDateId(date);
  const docRef = doc(db, "users", userId, "mealPlanner", dateId);
  // Ensure doc exists
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, { recipeIds: [recipeId] });
    return [recipeId];
  }
  // Add to array
  await updateDoc(docRef, { recipeIds: arrayUnion(recipeId) });
  const updated = await getDoc(docRef);
  return updated.data().recipeIds;
};

/**
 * Remove a recipe ID from a specific date's meal plan.
 * If the resulting array is empty, the date document is deleted.
 * @param {string} userId
 * @param {Date|string} date
 * @param {string} recipeId
 * @returns {Promise<Array<string>>} Updated array of recipeIds for that date
 */
export const removeRecipeFromDate = async (userId, date, recipeId) => {
  const dateId = formatDateId(date);
  const docRef = doc(db, "users", userId, "mealPlanner", dateId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return [];
  }
  await updateDoc(docRef, { recipeIds: arrayRemove(recipeId) });
  const updated = await getDoc(docRef);
  const list = updated.exists() ? updated.data().recipeIds : [];
  if (list.length === 0) {
    await deleteDoc(docRef);
  }
  return list;
};

/**
 * Clear all recipes for a specific date (deletes the document).
 * @param {string} userId
 * @param {Date|string} date
 * @returns {Promise<void>}
 */
export const clearDate = async (userId, date) => {
  const dateId = formatDateId(date);
  const docRef = doc(db, "users", userId, "mealPlanner", dateId);
  await deleteDoc(docRef);
};

/**
 * Delete all meal-plan entries for a user.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const clearAllMealPlans = async (userId) => {
  const colRef = mealPlannerCollection(userId);
  const snapshot = await getDocs(colRef);
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
};
