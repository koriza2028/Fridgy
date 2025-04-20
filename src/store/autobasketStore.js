import {
  doc,
  getDoc,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export const addProductToAutoBasket = async (userId, productInput) => {
  let product;

  // If the product is from the fridge, we will store just a reference (productId, name, amount)
  product = {
    autoBasketId: Date.now().toString(), // unique basket id
    productId: productInput.id,       // reference to the fridge product id
    amount: 1,  // Default amount, can be updated later
    isFromFridge: true,
  };

  const userDocRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist");
    }
    const userData = userDoc.data();
    const autoBasket = userData.autoBasket || { products: [] };

    // Find an existing basket entry.
    const index = autoBasket.products.findIndex((p) => {
      return p.productId === product.productId;
    });

    // If it exists, update the amount, else push a new product to the basket
    if (index !== -1) {
      autoBasket.products[index].amount += 1;  // Increment amount
    } else {
      autoBasket.products.push(product);  // Add the new product reference
    }

    transaction.update(userDocRef, { "autoBasket.products": autoBasket.products });
    return { id: userDoc.id, ...userData, autoBasket };
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
export const updateProductAmountInAutoBasket = async (userId, autoBasketItemId, newAmount) => {
  const userDocRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    const autoBasket = userData.autoBasket || { products: [] };
    const index = autoBasket.products.findIndex(p => p.autoBasketId === autoBasketItemId);
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
export const removeProductFromAutoBasket = async (userId, autoBasketItemId) => {
  return updateProductAmountInAutoBasket(userId, autoBasketItemId, 0);
};

// Update name of a product in autoBasket (only for custom items)
export const updateAutoBasketItemName = async (userId, autoBasketItemId, newName) => {
  const userDocRef = doc(db, "users", userId);

  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userDocRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    const autoBasket = userData.autoBasket || { products: [] };

    const index = autoBasket.products.findIndex(item => item.autoBasketId === autoBasketItemId);
    if (index === -1) throw new Error("AutoBasket item not found");

    autoBasket.products[index].name = newName;

    transaction.update(userDocRef, { "autoBasket.products": autoBasket.products });
    return { id: userDoc.id, ...userData, autoBasket };
  });
};
