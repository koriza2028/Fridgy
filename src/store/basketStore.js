// ../store/basketStore.js
import { doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the path based on your Firebase configuration

/**
 * Fetch the user's basket from Firestore. If it doesn't exist, create a new basket.
 * @param {string} userId
 * @returns {Promise<object>} Basket object with an id and a products array.
 */
export const fetchUserBasket = async (userId) => {
  const basketDocRef = doc(db, "baskets", userId);
  const basketSnap = await getDoc(basketDocRef);
  if (!basketSnap.exists()) {
    // Create a new basket with an empty products array
    const newBasket = { products: [] };
    await setDoc(basketDocRef, newBasket);
    return { id: userId, ...newBasket };
  }
  return { id: basketSnap.id, ...basketSnap.data() };
};

/**
 * Add a product to the user's basket.
 * If the product does not already exist in the basket, it will be added.
 * @param {string} userId
 * @param {object} product - The product object to add.
 * @returns {Promise<object>} The updated basket object.
 */
export const addProductToBasket = async (userId, product) => {
  const basketDocRef = doc(db, "baskets", userId);
  return await runTransaction(db, async (transaction) => {
    const basketDoc = await transaction.get(basketDocRef);
    if (!basketDoc.exists()) {
      throw new Error("Basket does not exist");
    }
    const basketData = basketDoc.data();
    const products = basketData.products || [];
    const productExists = products.some(p => p.id === product.id);
    if (!productExists) {
      products.push(product);
      transaction.update(basketDocRef, { products });
    }
    return { id: basketDoc.id, ...basketData, products };
  });
};

/**
 * Update the quantity (amount) of a product in the user's basket.
 * @param {string} userId
 * @param {string} productId
 * @param {number} newAmount
 * @returns {Promise<object>} The updated basket object.
 */
export const updateProductAmountInBasket = async (userId, productId, newAmount) => {
  const basketDocRef = doc(db, "baskets", userId);
  return await runTransaction(db, async (transaction) => {
    const basketDoc = await transaction.get(basketDocRef);
    if (!basketDoc.exists()) {
      throw new Error("Basket does not exist");
    }
    const basketData = basketDoc.data();
    let products = basketData.products || [];
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) {
      throw new Error("Product not found in basket");
    }
    products[productIndex].amount = newAmount;
    transaction.update(basketDocRef, { products });
    return { id: basketDoc.id, ...basketData, products };
  });
};

/**
 * Remove a product from the user's basket.
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<object>} The updated basket object.
 */
export const removeProductFromBasket = async (userId, productId) => {
  const basketDocRef = doc(db, "baskets", userId);
  return await runTransaction(db, async (transaction) => {
    const basketDoc = await transaction.get(basketDocRef);
    if (!basketDoc.exists()) {
      throw new Error("Basket does not exist");
    }
    const basketData = basketDoc.data();
    let products = basketData.products || [];
    products = products.filter(p => p.id !== productId);
    transaction.update(basketDocRef, { products });
    return { id: basketDoc.id, ...basketData, products };
  });
};

/**
 * Move selected products from the user's basket to the fridge.
 * For each selected product, this function updates the corresponding document in the 'products' collection,
 * then removes those products from the basket.
 * @param {string} userId
 * @param {Array<string>} selectedProductIds
 * @returns {Promise<object>} The updated basket object.
 */
export const moveProductsFromBasketToFridge = async (userId, selectedProductIds) => {
  const basketDocRef = doc(db, "baskets", userId);
  const basketSnap = await getDoc(basketDocRef);
  if (!basketSnap.exists()) {
    throw new Error("Basket not found");
  }
  const basketData = basketSnap.data();
  const basketProducts = basketData.products || [];
  
  // Filter the products to move based on the provided IDs
  const selectedProducts = basketProducts.filter(product => selectedProductIds.includes(product.id));

  // For each selected product, update its document in the 'products' collection
  await Promise.all(selectedProducts.map(async (basketProduct) => {
    const productDocRef = doc(db, "products", basketProduct.id);
    const productSnap = await getDoc(productDocRef);
    if (productSnap.exists()) {
      const productData = productSnap.data();
      const currentAmount = productData.amount || 0;
      const basketProductAmount = basketProduct.amount || 1;
      const newAmount = currentAmount + basketProductAmount;
      const updateData = { amount: newAmount };
      if (productData.isArchived && newAmount > 0) {
        updateData.isArchived = false;
      }
      await updateDoc(productDocRef, updateData);
    }
  }));

  // Remove the moved products from the basket
  const updatedProducts = basketProducts.filter(product => !selectedProductIds.includes(product.id));
  await updateDoc(basketDocRef, { products: updatedProducts });
  
  return { id: basketSnap.id, ...basketData, products: updatedProducts };
};
