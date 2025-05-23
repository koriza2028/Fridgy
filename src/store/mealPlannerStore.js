import {
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { fetchEnrichedRecipes } from "./cookingStore";
import {
  getMealPlanDocRef,
  getMealPlanCollectionRef,
} from "./utilsStore";

const formatDateId = (date) => {
  if (date instanceof Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return date;
};

export const fetchMealPlanForDate = async (ctx, date) => {
  const dateId = formatDateId(date);
  const docRef = getMealPlanDocRef(ctx, dateId);
  const snap = await getDoc(docRef);
  const recipeIds = snap.exists() ? snap.data().recipeIds || [] : [];

  const allRecipes = await fetchEnrichedRecipes(ctx);
  const plannedRecipes = allRecipes.filter(r => recipeIds.includes(r.id));

  return { date: dateId, recipes: plannedRecipes };
};

export const addRecipeToDate = async (ctx, date, recipeId) => {
  const dateId = formatDateId(date);
  const docRef = getMealPlanDocRef(ctx, dateId);

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, { recipeIds: [recipeId] });
    return [recipeId];
  }

  await updateDoc(docRef, { recipeIds: arrayUnion(recipeId) });
  const updated = await getDoc(docRef);
  return updated.data().recipeIds;
};

export const removeRecipeFromDate = async (ctx, date, recipeId) => {
  const dateId = formatDateId(date);
  const docRef = getMealPlanDocRef(ctx, dateId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];

  await updateDoc(docRef, { recipeIds: arrayRemove(recipeId) });

  const updated = await getDoc(docRef);
  const list = updated.exists() ? updated.data().recipeIds : [];

  if (list.length === 0) {
    await deleteDoc(docRef);
  }

  return list;
};

export const clearDate = async (ctx, date) => {
  const dateId = formatDateId(date);
  const docRef = getMealPlanDocRef(ctx, dateId);
  await deleteDoc(docRef);
};

export const clearAllMealPlans = async (ctx) => {
  const colRef = getMealPlanCollectionRef(ctx);
  const snapshot = await getDocs(colRef);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
};
