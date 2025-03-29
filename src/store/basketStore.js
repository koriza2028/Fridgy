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
      isFromFridge: true,  // Mark it as a fridge product
      // No need to store image or other non-reference data in basket
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

  // If the product is from the fridge, we will store just a reference (productId, name, amount)
  if (isFromFridge) {
    product = {
      basketId: Date.now().toString(), // unique basket id
      productId: productInput.id,       // reference to the fridge product id
      amount: 1,  // Default amount, can be updated later
      isFromFridge: true,
    };
  } else {
    // For non-fridge products, normalize and use them
    product = normalizeProduct(productInput);
    product = {
      basketId: Date.now().toString(),
      productId: product.id,
      ...product,
      amount: 1,
      isFromFridge: false,
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
      if (product.isFromFridge) {
        return p.productId === product.productId;  // Match by productId for fridge products
      }
      return p.basketId === product.basketId;  // Non-fridge products can match by basketId
    });

    // If it exists, update the amount, else push a new product to the basket
    if (index !== -1) {
      basket.products[index].amount += 1;  // Increment amount
    } else {
      basket.products.push(product);  // Add the new product reference
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
      basket.products.splice(index, 1);  // Remove product if amount is <= 0
    } else {
      basket.products[index].amount = newAmount;  // Update amount
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
  return updateProductAmountInBasket(userId, basketItemId, 0);  // Calls to set amount to 0
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
    
    // Fetch and enrich basket items by looking up full product details from the centralized product container
    const enrichedBasketItems = await Promise.all(
      basketRefs.map(async (basketItem) => {
        const productDocRef = doc(db, "users", userId, "products", basketItem.productId);  // Use only productId as reference
        const productSnap = await getDoc(productDocRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          return { ...productData, ...basketItem };  // Merge full product data with basket info
        }
        return basketItem;  // Return the basket item with reference if not found
      })
    );
    return enrichedBasketItems;
  } catch (error) {
    console.error("Error fetching basket products:", error);
    return [];
  }
};
