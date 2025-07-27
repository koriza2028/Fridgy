import { doc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Helper to choose path based on mode
const isFamilyMode = (mode) => mode === "family";

// General document reference (user or family root doc)
export const getDataRef = ({ userId, familyId, currentMode }) =>
  isFamilyMode(currentMode) && familyId
    ? doc(db, "families", familyId)
    : doc(db, "users", userId);

// Recipes
export const getRecipeDocRef = ({ userId, familyId, currentMode }, recipeId) =>
  isFamilyMode(currentMode) && familyId
    ? doc(db, "families", familyId, "recipes", recipeId)
    : doc(db, "users", userId, "recipes", recipeId);

export const getRecipeCollectionRef = ({ userId, familyId, currentMode }) =>
  isFamilyMode(currentMode) && familyId
    ? collection(db, "families", familyId, "recipes")
    : collection(db, "users", userId, "recipes");

// Products
export const getProductDocRef = ({ userId, familyId, currentMode }, productId) =>
  isFamilyMode(currentMode) && familyId
    ? doc(db, "families", familyId, "products", productId)
    : doc(db, "users", userId, "products", productId);

export const getFridgeCollectionRef = ({ userId, familyId, currentMode }) =>
  isFamilyMode(currentMode) && familyId
    ? collection(db, "families", familyId, "products")
    : collection(db, "users", userId, "products");

// For meal planning
export const getMealPlanDocRef = ({ userId, familyId, currentMode }, dateId) =>
  isFamilyMode(currentMode) && familyId
    ? doc(db, "families", familyId, "mealPlanner", dateId)
    : doc(db, "users", userId, "mealPlanner", dateId);

export const getMealPlanCollectionRef = ({ userId, familyId, currentMode }) =>
  isFamilyMode(currentMode) && familyId
    ? collection(db, "families", familyId, "mealPlanner")
    : collection(db, "users", userId, "mealPlanner");
