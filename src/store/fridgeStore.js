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
import { deleteObject, ref as storageRef } from "firebase/storage";
import { storage } from "../firebaseConfig"; // your initialized Firebase Storage
import { db } from "../firebaseConfig";

/**
 * Helper: Given a product reference (an object with at least a `productId`),
 * fetch the full product data from the centralized "products" subcollection.
 * Legacy string entries are normalized into an object.
 */
const getFullProductData = async (userId, productRef) => {
  let normalizedRef;
  if (typeof productRef === 'string') {
    normalizedRef = {
      productId: productRef,
      name: productRef,
      amount: 1,
      isArchived: false
    };
  } else {
    normalizedRef = { ...productRef };
    if (!normalizedRef.productId && normalizedRef.id) {
      normalizedRef.productId = normalizedRef.id;
    }
  }
  const productDocRef = doc(db, "users", userId, "products", normalizedRef.productId);
  const productSnap = await getDoc(productDocRef);
  if (!productSnap.exists()) return null;
  return { ...normalizedRef, ...productSnap.data() };
};

/**
 * Fetch all products from the centralized products container.
 */
export const fetchAllProducts = async (userId) => {
  try {
    const productsColRef = collection(db, "users", userId, "products");
    const querySnapshot = await getDocs(productsColRef);
    const products = [];
    querySnapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() });
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

/**
 * Fetch all available (non-archived) products.
 */
export const fetchAvailableProducts = async (userId) => {
  try {
    const allProducts = await fetchAllProducts(userId);
    return allProducts.filter(product => product.isArchived === false);
  } catch (error) {
    console.error("Error fetching available products:", error);
    return [];
  }
};

/**
 * Fetch archived products.
 */
export const fetchArchivedProducts = async (userId) => {
  try {
    const allProducts = await fetchAllProducts(userId);
    return allProducts.filter(product => product.isArchived === true);
  } catch (error) {
    console.error("Error fetching archived products:", error);
    return [];
  }
};

/**
 * Add or update a product in the centralized products container.
 * If productDataId is provided, the product document is updated;
 * otherwise, a new product document is created.
 */
export const addOrUpdateProduct = async (userId, productDataId, productData) => {
  try {
    const productsColRef = collection(db, "users", userId, "products");
    let productId = productDataId;

    if (productDataId) {
      const productDocRef = doc(db, "users", userId, "products", productDataId);
      const productSnap = await getDoc(productDocRef);

      if (productSnap.exists()) {
        const oldImageUri = productSnap.data()?.imageUri || null;
        const newImageUri = productData.imageUri;

        // Compare paths and delete old image if it has changed
        // Delete old image if it was removed or changed
        if (oldImageUri && (!newImageUri || oldImageUri !== newImageUri)) {
          const oldImgRef = storageRef(storage, oldImageUri);
          try {
            await deleteObject(oldImgRef);
          } catch (err) {
            console.warn("⚠️ Failed to delete old image:", err);
          }
        }

      }

      await updateDoc(productDocRef, productData);
    } else {
      productId = Date.now().toString();
      const productDocRef = doc(db, "users", userId, "products", productId);
      await setDoc(productDocRef, productData);
    }

    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error adding/updating product:", error);
    return [];
  }
};

/**
 * Decrease product quantity and mark as archived if the amount reaches zero.
 * This updates the product document in the centralized container.
 */
export const decrementProductAmount = async (userId, productId) => {
  try {
    const productDocRef = doc(db, "users", userId, "products", productId);
    const productSnap = await getDoc(productDocRef);
    if (!productSnap.exists()) return;
    const productData = productSnap.data();
    const currentAmount = productData.amount || 0;
    const updatedAmount = Math.max(currentAmount - 1, 0);
    const isArchived = updatedAmount === 0;
    await updateDoc(productDocRef, { amount: updatedAmount, isArchived });
    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error decrementing product amount:", error);
    return [];
  }
};

/**
 * Increment product amount in the centralized container.
 */
export const incrementProductAmount = async (userId, productId) => {
  try {
    const productDocRef = doc(db, "users", userId, "products", productId);
    const productSnap = await getDoc(productDocRef);
    if (!productSnap.exists()) return;
    const productData = productSnap.data();
    const updatedAmount = (productData.amount || 0) + 1;
    await updateDoc(productDocRef, { amount: updatedAmount, isArchived: false });
    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error incrementing product amount:", error);
    return [];
  }
};

/**
 * Delete a product from the centralized container.
 * Before deletion, check that the product is not referenced in recipes or basket.
 */
export const deleteProduct = async (userId, productId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const recipes = userData.recipes || [];
    const basketRefs = userData.basket?.products || [];
    
    const isUsedInRecipes = recipes.some(recipe => {
      const mandatory = recipe.mandatoryIngredients || [];
      const optional = recipe.optionalIngredients || [];
      return [...mandatory, ...optional].some(ingredient => ingredient.id === productId);
    });
    const isUsedInBasket = basketRefs.some(product => product.productId === productId);
    
    if (isUsedInRecipes || isUsedInBasket) {
      throw new Error("This product is used in a recipe or basket and cannot be deleted.");
    }
    
    const productDocRef = doc(db, "users", userId, "products", productId);
    const productSnap = await getDoc(productDocRef);

    let imagePath = null;
    if (productSnap.exists()) {
      imagePath = productSnap.data()?.imageUri || null;
    }

    // Delete product from Firestore
    await deleteDoc(productDocRef);

    // Delete image from Firebase Storage (if it exists)
    if (imagePath) {
      const imgRef = storageRef(storage, imagePath);
      try {
        await deleteObject(imgRef);
      } catch (error) {
        console.warn("⚠️ Failed to delete image on product delete:", error);
      }
    }
    
    
    return fetchAvailableProducts(userId);
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

/**
 * Unified function to add or move a product to the basket.
 * In the normalized model, the basket array (inside the user document) stores only references to products.
 */
export const addOrMoveProductToBasket = async (userId, productInput) => {
  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    let basketRefs = userData.basket?.products || [];
    
    // Expecting productInput to have a productId (or id).
    const productId = productInput.productId || productInput.id;
    
    // Build basket reference metadata.
    let basketItem = {
      basketId: Date.now().toString(), // new unique id for basket entry if new
      productId,
      amount: 1,
      isFromFridge: true,
    };
    
    const index = basketRefs.findIndex((p) => p.productId === productId);
    if (index !== -1) {
      basketRefs[index].amount += 1;
    } else {
      basketRefs.push(basketItem);
    }
    
    transaction.update(userDocRef, { "basket.products": basketRefs });
    return { id: userDoc.id, ...userData, basket: { products: basketRefs } };
  });
};

/**
 * Move a product (from the centralized products container) to the basket.
 * This function fetches the product details from the subcollection "products"
 * and then calls addOrMoveProductToBasket to add it (or increase its quantity)
 * in the user's basket.
 *
 * @param {string} userId - The user's id.
 * @param {string} productId - The id of the product in the centralized store.
 */
export const moveProductToBasket = async (userId, productId) => {
  const productDocRef = doc(db, "users", userId, "products", productId);
  const productSnap = await getDoc(productDocRef);
  if (!productSnap.exists()) {
    throw new Error("Product not found in the centralized store");
  }
  const productData = productSnap.data();
  return await addOrMoveProductToBasket(userId, { ...productData, id: productId });
};
