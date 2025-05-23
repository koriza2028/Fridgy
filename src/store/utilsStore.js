import { doc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";

// General document reference (user or family root doc)
export const getDataRef = ({ userId, familyId }) =>
  familyId ? doc(db, "families", familyId) : doc(db, "users", userId);

// Recipes
export const getRecipeDocRef = ({ userId, familyId }, recipeId) =>
  familyId ? doc(db, "families", familyId, "recipes", recipeId) : doc(db, "users", userId, "recipes", recipeId);

export const getRecipeCollectionRef = ({ userId, familyId }) =>
  familyId ? collection(db, "families", familyId, "recipes") : collection(db, "users", userId, "recipes");

// Products
export const getProductDocRef = ({ userId, familyId }, productId) =>
  familyId ? doc(db, "families", familyId, "products", productId) : doc(db, "users", userId, "products", productId);

export const getFridgeCollectionRef = ({ userId, familyId }) =>
  familyId ? collection(db, "families", familyId, "products") : collection(db, "users", userId, "products");

// For meal planning
export const getMealPlanDocRef = ({ userId, familyId }, dateId) =>
  familyId
    ? doc(db, "families", familyId, "mealPlanner", dateId)
    : doc(db, "users", userId, "mealPlanner", dateId);

export const getMealPlanCollectionRef = ({ userId, familyId }) =>
  familyId
    ? collection(db, "families", familyId, "mealPlanner")
    : collection(db, "users", userId, "mealPlanner");
