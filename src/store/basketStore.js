import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the path based on your Firebase configuration

// Utility to normalize a product entry.
// If the product is a string, return an object with that string as the id, name, and default amount of 1.
const normalizeProduct = (product) => {
  if (typeof product === 'string') {
    return { id: product, name: product, amount: 1 };
  } else {
    return {
      id: product.id,
      name: product.name,
      amount: 1,
      ...product
    };
  }
};

/**
 * Fetch the user's document from Firestore.
 * If it doesn't exist, create a new document with empty basket and fridge.
 * @param {string} userId
 * @returns {Promise<object>} The user data including basket and fridge.
 */
export const fetchUserData = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    const newUserData = {
      basket: { products: [] },
      fridge: { products: [] }
    };
    await setDoc(userDocRef, newUserData);
    return { id: userId, ...newUserData };
  }
  return { id: userSnap.id, ...userSnap.data() };
};

/**
 * Add (or increase) a product in the user's basket.
 * If the product already exists (by matching id or originalFridgeId), its amount is incremented by one;
 * otherwise, it’s added with amount = 1.
 * Uses normalizeProduct to ensure the product is in the correct format.
 * If the product comes from the fridge, we ignore its current amount and always start at 1.
 *
 * @param {string} userId
 * @param {object|string} productInput - Product object or string.
 *        If productInput has an `isFromFridge` property set to true, it is assumed to come from the fridge.
 * @returns {Promise<object>} The updated user data.
 */
export const addProductToBasket = async (userId, productInput, isFromFridge) => {
  let product;
  // If the product comes from the fridge, build the basket entry using a reference to the fridge product.
  if (isFromFridge) {
    product = {
      // We'll store a new unique basket id when adding.
      // The originalFridgeId keeps the reference to the fridge product.
      originalFridgeId: productInput.id,
      name: productInput.name,
      category: productInput.category,
      imageUri: productInput.imageUri || null,
      amount: 1,
      isFromFridge: true,
    };
  } else {
    // For other products, use the normalized version and always set the amount to 1.
    product = normalizeProduct(productInput);
    product.amount = 1;
  }

  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    const basket = userData.basket || { products: [] };

    // Find an existing basket entry.
    // For fridge products, match based on originalFridgeId; otherwise, match on the product id.
    const index = basket.products.findIndex((p) => {
      if (product.originalFridgeId) {
        return p.originalFridgeId === product.originalFridgeId;
      } else {
        return p.id === product.id;
      }
    });
    
    if (index !== -1) {
      // Increase the amount by one if already present.
      basket.products[index].amount += 1;
    } else {
      // If adding for the first time, assign a new unique basket id if coming from fridge.
      if (product.originalFridgeId) {
        product.id = Date.now().toString();
      }
      basket.products.push(product);
    }
    
    transaction.update(userDocRef, { "basket.products": basket.products });
    return { id: userDoc.id, ...userData, basket };
  });
};

/**
 * Update the amount of a product in the basket.
 * If newAmount is less than or equal to 0, the product is removed.
 * @param {string} userId
 * @param {string} productId - The basket product id.
 * @param {number} newAmount
 * @returns {Promise<object>} The updated user data.
 */
export const updateProductAmountInBasket = async (userId, productId, newAmount) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    const basket = userData.basket || { products: [] };
    const index = basket.products.findIndex(p => p.id === productId);
    if (index === -1) {
      throw new Error("Product not found in basket");
    }
    if (newAmount <= 0) {
      basket.products.splice(index, 1);
    } else {
      basket.products[index].amount = newAmount;
    }
    transaction.update(userDocRef, { "basket.products": basket.products });
    return { id: userDoc.id, ...userData, basket };
  });
};

/**
 * Remove a product completely from the basket.
 * @param {string} userId
 * @param {string} productId - The basket product id.
 * @returns {Promise<object>} The updated user data.
 */
export const removeProductFromBasket = async (userId, productId) => {
  return updateProductAmountInBasket(userId, productId, 0);
};

/**
 * Move selected products from the basket to the fridge.
 * For each selected basket product, add its amount to the corresponding fridge product.
 * If a matching fridge product is found (by originalFridgeId or name), its amount is increased.
 * Otherwise, a new fridge product is created with a new unique id.
 * After moving, the basket product is removed.
 *
 * @param {string} userId
 * @param {Array<string>} selectedProductIds - Array of basket product ids.
 * @returns {Promise<object>} The updated user data.
 */
export const moveProductsFromBasketToFridge = async (userId, selectedProductIds) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    const basket = userData.basket || { products: [] };
    const fridge = userData.fridge || { products: [] };

    selectedProductIds.forEach(basketProductId => {
      const basketIndex = basket.products.findIndex(p => p.id === basketProductId);
      if (basketIndex === -1) return;
      const basketProduct = basket.products[basketIndex];

      // Find matching fridge product: if the basket product came from the fridge, match by originalFridgeId;
      // otherwise, match by name.
      const fridgeIndex = fridge.products.findIndex(p => {
        if (basketProduct.isFromFridge && basketProduct.originalFridgeId) {
          return p.id === basketProduct.originalFridgeId;
        }
        return p.name === basketProduct.name;
      });
      if (fridgeIndex !== -1) {
        fridge.products[fridgeIndex].amount += basketProduct.amount;
      } else {
        // Create a new fridge product with a new unique id.
        const newFridgeProduct = { ...basketProduct };
        // Remove basket-specific properties.
        delete newFridgeProduct.id;
        delete newFridgeProduct.originalFridgeId;
        delete newFridgeProduct.isFromFridge;
        // Assign a new unique id.
        newFridgeProduct.id = Date.now().toString();
        fridge.products.push(newFridgeProduct);
      }
      // Remove the product from the basket.
      basket.products.splice(basketIndex, 1);
    });

    transaction.update(userDocRef, {
      "basket.products": basket.products,
      "fridge.products": fridge.products
    });

    return { id: userDoc.id, ...userData, basket, fridge };
  });
};
