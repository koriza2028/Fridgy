import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  runTransaction, 
  deleteDoc, 
  getDocs, 
  collection 
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the path based on your Firebase configuration

// Utility to normalize a product entry.
// If the product is a string, return an object with that string as the id, name, and default amount of 1.
const normalizeProduct = (product) => {
  if (typeof product === 'string') {
    return { id: product, name: product, amount: 1, isFromFridge: false };
  } else {
    return {
      id: product.id,
      name: product.name,
      amount: 1,
      isFromFridge: true,
      ...product
    };
  }
};

/**
 * Fetch the user's document from Firestore.
 * If it doesn't exist, create a new document with an empty basket.
 * (Fridge products are stored in a separate subcollection "products".)
 * @param {string} userId
 * @returns {Promise<object>} The user data including basket.
 */
export const fetchUserData = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) {
    const newUserData = {
      basket: { products: [] }
    };
    await setDoc(userDocRef, newUserData);
    return { id: userId, ...newUserData };
  }
  return { id: userSnap.id, ...userSnap.data() };
};

/**
 * Add (or increase) a product in the user's basket.
 * For fridge products, we build the basket item with:
 *   - basketId: a new unique id,
 *   - productId: set from productInput.id,
 *   - originalFridgeId: also set from productInput.id.
 * For non-fridge products, we normalize and then create a basket item with:
 *   - basketId: a new unique id,
 *   - productId: taken from the normalized product's id.
 * @param {string} userId
 * @param {object|string} productInput - Product object or string.
 * @param {boolean} isFromFridge - Indicates if the product comes from the fridge.
 * @returns {Promise<object>} The updated user data.
 */
export const addProductToBasket = async (userId, productInput, isFromFridge) => {
  let product;
  if (isFromFridge) {
    product = {
      basketId: Date.now().toString(), // unique basket id
      productId: productInput.id,       // reference to the fridge product id
      originalFridgeId: productInput.id,
      name: productInput.name,
      category: productInput.category,
      imageUri: productInput.imageUri || null,
      amount: 1,
      isFromFridge: true,
    };
  } else {
    product = normalizeProduct(productInput);
    product = {
      basketId: Date.now().toString(),
      productId: product.id,
      ...product,
      amount: 1,
      isFromFridge: false
    };
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
    const index = basket.products.findIndex((p) => {
      if (product.originalFridgeId) {
        return p.originalFridgeId === product.originalFridgeId;
      } else {
        return p.productId === product.productId;
      }
    });
    
    if (index !== -1) {
      basket.products[index].amount += 1;
    } else {
      basket.products.push(product);
    }
    
    transaction.update(userDocRef, { "basket.products": basket.products });
    return { id: userDoc.id, ...userData, basket };
  });
};

/**
 * Update the amount of a product in the basket.
 * If newAmount is less than or equal to 0, the product is removed.
 * Uses basketId to identify the basket item.
 * @param {string} userId
 * @param {string} basketItemId - The basket product's unique id.
 * @param {number} newAmount
 * @returns {Promise<object>} The updated user data.
 */
export const updateProductAmountInBasket = async (userId, basketItemId, newAmount) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    const basket = userData.basket || { products: [] };
    const index = basket.products.findIndex(p => p.basketId === basketItemId);
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
 * @param {string} basketItemId - The basket product's unique id.
 * @returns {Promise<object>} The updated user data.
 */
export const removeProductFromBasket = async (userId, basketItemId) => {
  return updateProductAmountInBasket(userId, basketItemId, 0);
};

/**
 * Unified function to add or move a product to the basket.
 * The basket stores only minimal references (productId and amount).
 * @param {string} userId
 * @param {object} productInput - Must include productId (or id).
 * @returns {Promise<object>} The updated user data.
 */
export const addOrMoveProductToBasket = async (userId, productInput) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    let basket = userData.basket || { products: [] };
    
    const productId = productInput.productId || productInput.id;
    let basketItem = {
      basketId: Date.now().toString(),
      productId,
      amount: 1,
      isFromFridge: productId ? true : false
    };
    
    const index = basket.products.findIndex((p) => p.productId === productId);
    if (index !== -1) {
      basket.products[index].amount += 1;
    } else {
      basket.products.push(basketItem);
    }
    
    transaction.update(userDocRef, { "basket.products": basket.products });
    return { id: userDoc.id, ...userData, basket };
  });
};

/**
 * Move a product (from the centralized products container) to the basket.
 * This function fetches the product details from "products" and then calls addOrMoveProductToBasket.
 * @param {string} userId - The user's id.
 * @param {string} productId - The id of the fridge product.
 * @returns {Promise<object>} The updated user data.
 */
export const moveProductToBasket = async (userId, productId) => {
  const productDocRef = doc(db, "users", userId, "products", productId);
  const productSnap = await getDoc(productDocRef);
  if (!productSnap.exists()) {
    throw new Error("Product not found in the centralized products container");
  }
  const productData = productSnap.data();
  return await addOrMoveProductToBasket(userId, { ...productData, id: productId });
};

/**
 * Move selected products from the basket to the fridge.
 * For each selected basket product, update the corresponding product in the "products" container:
 * add the basket amount to the product's amount.
 * Then remove the basket item from the user's basket.
 * @param {string} userId
 * @param {Array<string>} selectedProductIds - Array of basket product basketIds.
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
    let basketRefs = userData.basket?.products || [];
    
    // For each basket item to move:
    for (const basketItem of basketRefs.filter(item => selectedProductIds.includes(item.basketId))) {
      const fridgeDocRef = doc(db, "users", userId, "products", basketItem.productId);
      const fridgeSnap = await transaction.get(fridgeDocRef);
      if (fridgeSnap.exists()) {
        const productData = fridgeSnap.data();
        const newAmount = (productData.amount || 0) + basketItem.amount;
        transaction.update(fridgeDocRef, { amount: newAmount });
      } else {
        transaction.set(fridgeDocRef, { amount: basketItem.amount });
      }
      // Remove this basket item.
      basketRefs = basketRefs.filter(item => item.basketId !== basketItem.basketId);
    }
    transaction.update(userDocRef, { "basket.products": basketRefs });
    return { id: userDoc.id, ...userData, basket: { products: basketRefs } };
  });
};

/**
 * Fetch enriched basket items with full product details (like name and imageUri)
 * from the centralized products container.
 * @param {string} userId
 * @returns {Promise<Array<object>>} Array of enriched basket items.
 */
export const fetchBasketProducts = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];
    const basketRefs = userSnap.data().basket?.products || [];
    const enrichedBasketItems = await Promise.all(
      basketRefs.map(async (basketItem) => {
        const productDocRef = doc(db, "users", userId, "products", basketItem.productId);
        const productSnap = await getDoc(productDocRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          return { ...productData, ...basketItem };
        }
        return basketItem;
      })
    );
    return enrichedBasketItems;
  } catch (error) {
    console.error("Error fetching basket products:", error);
    return [];
  }
};
