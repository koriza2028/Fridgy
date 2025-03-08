import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Fetch all non-archived products from a user's fridge.
 * @param {string} userId - The ID of the user.
 */
export const fetchUserFridgeProducts = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];
    const data = userSnap.data();
    const fridgeProducts = data.fridge?.products || [];
    return fridgeProducts.filter((product) => product.isArchived === false);
  } catch (error) {
    console.error("Error fetching fridge products:", error);
    return [];
  }
};

/**
 * Fetch archived products from a user's fridge.
 * @param {string} userId - The ID of the user.
 */
export const fetchArchivedProducts = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];
    const data = userSnap.data();
    const fridgeProducts = data.fridge?.products || [];
    return fridgeProducts.filter((product) => product.isArchived === true);
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
};

/**
 * Fetch available products by category from a user's fridge.
 * @param {string} userId - The ID of the user.
 * @param {string} category - Product category.
 */
export const fetchAvailableProductsByCategory = async (userId, category) => {
  try {
    const products = await fetchUserFridgeProducts(userId);
    return category === "All"
      ? products
      : products.filter((product) => product.category === category);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
};

/**
 * Fetch archived products by category from a user's fridge.
 * @param {string} userId - The ID of the user.
 * @param {string} category - Product category.
 */
export const fetchArchivedProductsByCategory = async (userId, category) => {
  try {
    const products = await fetchArchivedProducts(userId);
    return category === "All"
      ? products
      : products.filter((product) => product.category === category);
  } catch (error) {
    console.error("Error fetching archived products by category:", error);
    return [];
  }
};

/**
 * Add or update a product in the fridge.
 * @param {string} userId - The ID of the user.
 * @param {string|null} productDataId - The product ID if updating; null if adding.
 * @param {object} productData - Product details.
 */
export const addOrUpdateProduct = async (userId, productDataId, productData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    let userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) {
      // Create a new document with empty fridge and basket if it doesn't exist.
      await setDoc(userDocRef, { fridge: { products: [] }, basket: { products: [] } });
      userSnap = await getDoc(userDocRef);
    }
    const userData = userSnap.data();
    let fridge = userData.fridge?.products || [];
    if (productDataId) {
      const index = fridge.findIndex((p) => p.id === productDataId);
      if (index !== -1) {
        fridge[index] = { ...fridge[index], ...productData };
      } else {
        fridge.push({ id: productDataId, ...productData });
      }
    } else {
      const newId = Date.now().toString();
      fridge.push({ id: newId, ...productData });
    }
    await updateDoc(userDocRef, { "fridge.products": fridge });
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
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    let fridge = userData.fridge?.products || [];
    const index = fridge.findIndex((p) => p.id === productId);
    if (index === -1) return;
    const currentAmount = fridge[index].amount;
    const updatedAmount = Math.max(currentAmount - 1, 0);
    const isArchived = updatedAmount === 0;
    fridge[index] = { ...fridge[index], amount: updatedAmount, isArchived };
    await updateDoc(userDocRef, { "fridge.products": fridge });
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
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    let fridge = userData.fridge?.products || [];
    const index = fridge.findIndex((p) => p.id === productId);
    if (index === -1) return;
    const updatedAmount = fridge[index].amount + 1;
    fridge[index] = { ...fridge[index], amount: updatedAmount, isArchived: false };
    await updateDoc(userDocRef, { "fridge.products": fridge });
    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error incrementing product amount:", error);
    return [];
  }
};

/**
 * Delete a product from the fridge.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the product.
 */
export const deleteProduct = async (userId, productId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    let fridge = userData.fridge?.products || [];
    fridge = fridge.filter((p) => p.id !== productId);
    await updateDoc(userDocRef, { "fridge.products": fridge });
    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

/**
 * Move a product to the basket.
 * When moving to basket, a new basket item is created with its own unique id, and the original fridge product's id is saved as originalFridgeId.
 * The product in the fridge remains unchanged.
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The fridge product ID.
 */
export const moveProductToBasket = async (userId, productId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    const userData = userSnap.data();
    let fridge = userData.fridge?.products || [];
    const productIndex = fridge.findIndex((p) => p.id === productId);
    if (productIndex === -1) return;
    const productData = fridge[productIndex];
    let basket = userData.basket?.products || [];
    const newBasketId = Date.now().toString();
    basket.push({
      id: newBasketId,
      originalFridgeId: productData.id,
      name: productData.name,
      category: productData.category,
      amount: 1,
      isFromFridge: true,
    });
    // Do not remove from fridge.
    await updateDoc(userDocRef, { "basket.products": basket });
    return fetchUserFridgeProducts(userId);
  } catch (error) {
    console.error("Error moving product to basket:", error);
    return [];
  }
};
