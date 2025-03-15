import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Fetch all non-archived products from a user's fridge.
 * @param {string} userId - The ID of the user.
 */
export const fetchAllFridgeProducts = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];
    const data = userSnap.data();
    const fridgeProducts = data.fridge?.products || [];
    return fridgeProducts;
  } catch (error) {
    console.error("Error fetching fridge products:", error);
    return [];
  }
};

/**
 * Fetch all available (non-archived) products from a user's fridge.
 * @param {string} userId - The ID of the user.
 */
export const fetchAvailableProducts = async (userId) => {
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
    return fetchAvailableProducts(userId);
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
    return fetchAvailableProducts(userId);
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
    return fetchAvailableProducts(userId);
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
    const recipes = userData.recipes || [];
    const basketProducts = userData.basket?.products || [];
    
    // Check if the product is used in any recipe
    const isUsedInRecipes = recipes.some(recipe => {
      const mandatory = recipe.mandatoryIngredients || [];
      const optional = recipe.optionalIngredients || [];
      return [...mandatory, ...optional].some(ingredient => ingredient.id === productId);
    });
    
    // Check if the product is in the basket products
    const isUsedInBasket = basketProducts.some(product => product.id === productId);
    
    if (isUsedInRecipes || isUsedInBasket) {
      throw new Error("This product is used in a recipe or basket and cannot be deleted.");
    }
    
    // Proceed with deleting the product from the fridge
    let fridge = userData.fridge?.products || [];
    fridge = fridge.filter(product => product.id !== productId);
    await updateDoc(userDocRef, { "fridge.products": fridge });
    
    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

/**
 * Unified function to add or move a product to the basket.
 * This function uses a transaction to ensure atomic updates. It accepts a flag `fromFridge` to determine
 * if the product comes from the fridge. For products from the fridge, the reference is stored (using originalFridgeId)
 * and the amount is always set/increased by 1 regardless of the fridge product's amount.
 *
 * @param {string} userId - The ID of the user.
 * @param {object} productInput - The product details (either from the fridge or another source).
 * @param {boolean} [fromFridge=false] - Flag indicating whether the product comes from the fridge.
 */
export const addOrMoveProductToBasket = async (userId, productInput) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    let basket = userData.basket?.products || [];
    
    let productData = {
        originalFridgeId: productInput.id,
        name: productInput.name,
        category: productInput.category,
        imageUri: productInput.imageUri || null,
        amount: 1,
        isFromFridge: true,
    };
    
    // Find if this product is already in the basket.
    // If the product comes from the fridge, we match using originalFridgeId.
    const index = basket.findIndex((p) => {
      if (productData.originalFridgeId) {
         return p.originalFridgeId === productData.originalFridgeId;
      } else {
         return p.id === productData.id;
      }
    });
    
    if (index !== -1) {
      // If found, always increase the amount by one.
      basket[index].amount += 1;
    } else {
      // Otherwise, add a new basket entry with a new unique id.
      const newBasketId = Date.now().toString();
      basket.push({
        id: newBasketId,
        ...productData,
      });
    }
    
    transaction.update(userDocRef, { "basket.products": basket });
    return { id: userDoc.id, ...userData, basket: { products: basket } };
  });
};

/**
 * Move a product from the fridge to the basket.
 * This function looks up the product in the fridge by its ID and then uses the unified function
 * to add it to the basket (increasing the amount by one if it already exists in the basket).
 * The fridge product itself is not removed or modified.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} productId - The ID of the fridge product.
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
    // Use the unified function to add/move the product from the fridge.
    await addOrMoveProductToBasket(userId, productData);
    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error moving product to basket:", error);
    return [];
  }
};
