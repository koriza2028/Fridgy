import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    runTransaction,
    collection
  } from "firebase/firestore";
  import { db } from "../firebaseConfig";
  
  // Utility to normalize a product reference (minimal fields only)
  const normalizeProductReference = (productInput) => {
    const productId = typeof productInput === 'string' ? productInput : productInput.id;
    return {
      basketId: Date.now().toString(),
      productId,
      amount: 1,
    };
  };
  
  // Add or update product in autobasket
  export const addProductToAutoBasket = async (userId, productInput) => {
    const userDocRef = doc(db, "users", userId);
    const productRef = normalizeProductReference(productInput);
  
    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw new Error("User document does not exist");
  
      const userData = userDoc.data();
      const autobasket = userData.autobasket || { products: [] };
      const index = autobasket.products.findIndex(p => p.productId === productRef.productId);
  
      if (index !== -1) {
        autobasket.products[index].amount += 1;
      } else {
        autobasket.products.push(productRef);
      }
  
      transaction.update(userDocRef, { "autobasket.products": autobasket.products });
      return { id: userDoc.id, ...userData, autobasket };
    });
  };
  
  export const updateProductAmountInAutoBasket = async (userId, basketItemId, newAmount) => {
    const userDocRef = doc(db, "users", userId);
    return await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists()) throw new Error("User document does not exist");
  
      const userData = userDoc.data();
      const autobasket = userData.autobasket || { products: [] };
      const index = autobasket.products.findIndex(p => p.basketId === basketItemId);
      if (index === -1) throw new Error("Product not found in autobasket");
  
      if (newAmount <= 0) {
        autobasket.products.splice(index, 1);
      } else {
        autobasket.products[index].amount = newAmount;
      }
  
      transaction.update(userDocRef, { "autobasket.products": autobasket.products });
      return { id: userDoc.id, ...userData, autobasket };
    });
  };
  
  export const removeProductFromAutoBasket = async (userId, basketItemId) => {
    return updateProductAmountInAutoBasket(userId, basketItemId, 0);
  };
  
  export const fetchAutoBasketProducts = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return [];
  
      const autobasketRefs = userSnap.data().autobasket?.products || [];
  
      const enriched = await Promise.all(
        autobasketRefs.map(async (item) => {
          const productDocRef = doc(db, "users", userId, "products", item.productId);
          const productSnap = await getDoc(productDocRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            return { ...productData, ...item };
          }
          return item;
        })
      );
  
      return enriched;
    } catch (error) {
      console.error("Error fetching autobasket products:", error);
      return [];
    }
  };