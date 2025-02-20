import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, getDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Get the fridge collection reference for a user.
 * @param {string} userId - The ID of the user.
 */
const getFridgeCollection = (userId) => collection(db, `users/${userId}/fridge`);

/**
 * Fetch all products from a user's fridge (Local-First).
 * @param {string} userId - The ID of the user.
 */
export const fetchUserFridgeProducts = async (userId) => {
  try {
    const fridgeCollection = getFridgeCollection(userId);
    const q = query(fridgeCollection, where("isArchived", "==", false));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching fridge products:", error);
    return [];
  }
};

/**
 * Fetch archived products.
 * @param {string} userId - The ID of the user.
 */
export const fetchArchivedProducts = async (userId) => {
  try {
    const fridgeCollection = getFridgeCollection(userId);
    const q = query(fridgeCollection, where("isArchived", "==", true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
};

/**
 * Fetch available products by category.
 * @param {string} userId - The ID of the user.
 * @param {string} category - Product category.
 */
export const fetchAvailableProductsByCategory = async (userId, category) => {
  try {
    const fridgeCollection = getFridgeCollection(userId);
    const q = category === "All" 
      ? query(fridgeCollection, where("isArchived", "==", false))
      : query(fridgeCollection, where("isArchived", "==", false), where("category", "==", category));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
};

/**
 * Fetch archived products by category.
 * @param {string} userId - The ID of the user.
 * @param {string} category - Product category.
 */
export const fetchArchivedProductsByCategory = async (userId, category) => {
  try {
    const fridgeCollection = getFridgeCollection(userId);
    const q = category === "All" 
      ? query(fridgeCollection, where("isArchived", "==", true))
      : query(fridgeCollection, where("isArchived", "==", true), where("category", "==", category));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching archived products by category:", error);
    return [];
  }
};

/**
 * Add or update a product in the fridge.
 * @param {string} userId - The ID of the user.
 * @param {object} productData - Product details.
 */
export const addOrUpdateProduct = async (userId, productDataId, productData) => {
  try {
    if (productDataId) {
      const productRef = doc(db, `users/${userId}/fridge`, productDataId);
      await updateDoc(productRef, productData);
    } else {
      const fridgeCollection = getFridgeCollection(userId);
      await addDoc(fridgeCollection, productData);
    }

    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error adding/updating product:", error);
    return [];
  }
};

/**
 * Decrease product quantity and archive if needed.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 */
export const decrementProductAmount = async (userId, productId) => {
  try {
    const productRef = doc(db, `users/${userId}/fridge`, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) return;

    const currentAmount = productSnap.data().amount;
    const updatedAmount = Math.max(currentAmount - 1, 0);
    const isArchived = updatedAmount === 0;

    await updateDoc(productRef, { amount: updatedAmount, isArchived });

    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error decrementing product amount:", error);
    return [];
  }
};

/**
 * Increment product amount.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 */
export const incrementProductAmount = async (userId, productId) => {
  try {
    const productRef = doc(db, `users/${userId}/fridge`, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) return;

    const updatedAmount = productSnap.data().amount + 1;
    await updateDoc(productRef, { amount: updatedAmount, isArchived: false });

    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error incrementing product amount:", error);
    return [];
  }
};

/**
 * Delete a product.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 */
export const deleteProduct = async (userId, productId) => {
  try {
    const productRef = doc(db, `users/${userId}/fridge`, productId);
    await deleteDoc(productRef);

    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

/**
 * Move a product to the basket.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 */
export const moveProductToBasket = async (userId, productId) => {
  try {
    const productRef = doc(db, `users/${userId}/fridge`, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) return;

    const productData = productSnap.data();
    const basketRef = doc(db, `users/${userId}/basket`, productId);

    await setDoc(basketRef, {
      name: productData.name,
      category: productData.category,
      amount: 1,
      isFromFridge: true,
    });

    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error moving product to basket:", error);
    return [];
  }
};
