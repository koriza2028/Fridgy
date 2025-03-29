import {
  doc,
  getDoc,
  runTransaction
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

// Save draft autoBasket to Firestore
export const saveAutoBasketDraft = async (userId, draftItems) => {
  const userDocRef = doc(db, "users", userId);

  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    const existing = userData.autoBasket?.products || [];

    const merged = [...existing];

    draftItems.forEach((draftItem) => {
      const index = merged.findIndex(p => p.productId === draftItem.productId);
      if (index !== -1) {
        merged[index].amount += draftItem.amount;
      } else {
        merged.push(draftItem);
      }
    });

    transaction.update(userDocRef, { "autoBasket.products": merged });
  });
};

// Fetch enriched autoBasket items with full product details
export const fetchAutoBasketProducts = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];

    const autoBasketRefs = userSnap.data().autoBasket?.products || [];

    const enriched = await Promise.all(
      autoBasketRefs.map(async (item) => {
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
    console.error("Error fetching autoBasket products:", error);
    return [];
  }
};

// Update product amount in autoBasket
export const updateProductAmountInAutoBasket = async (userId, basketItemId, newAmount) => {
  const userDocRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    const autoBasket = userData.autoBasket || { products: [] };
    const index = autoBasket.products.findIndex(p => p.basketId === basketItemId);
    if (index === -1) throw new Error("Product not found in autoBasket");

    if (newAmount <= 0) {
      autoBasket.products.splice(index, 1);
    } else {
      autoBasket.products[index].amount = newAmount;
    }

    transaction.update(userDocRef, { "autoBasket.products": autoBasket.products });
    return { id: userDoc.id, ...userData, autoBasket };
  });
};

// Remove product from autoBasket
export const removeProductFromAutoBasket = async (userId, basketItemId) => {
  return updateProductAmountInAutoBasket(userId, basketItemId, 0);
};

// Update name of a product in autoBasket (only for custom items)
export const updateAutoBasketItemName = async (userId, basketItemId, newName) => {
  const userDocRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    const autoBasket = userData.autoBasket || { products: [] };

    const index = autoBasket.products.findIndex(item => item.basketId === basketItemId);
    if (index === -1) throw new Error("AutoBasket item not found");

    autoBasket.products[index].name = newName;

    transaction.update(userDocRef, { "autoBasket.products": autoBasket.products });
    return { id: userDoc.id, ...userData, autoBasket };
  });
};