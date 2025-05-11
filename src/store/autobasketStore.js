import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import useProductStore from './productStore';

const normalizeProduct = (product) => {
  return typeof product === 'string'
    ? { id: product, name: product, amount: 1, isFromFridge: false }
    : { id: product.id, name: product.name, amount: 1, isFromFridge: true };
};

// --- AUTO BASKET LOGIC ---

export const addProductToAutoBasket = async (userId, productInput) => {
  const product = {
    autoBasketId: Date.now().toString(),
    productId: productInput.id,
    amount: 1,
    isFromFridge: true,
  };

  const ref = doc(db, "users", userId);
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User not found");
    const user = snap.data();
    const autoBasket = user.autoBasket || { products: [] };

    const index = autoBasket.products.findIndex(p => p.productId === product.productId);
    if (index !== -1) {
      autoBasket.products[index].amount += 1;
    } else {
      autoBasket.products.push(product);
    }

    tx.update(ref, { "autoBasket.products": autoBasket.products });
    return { id: snap.id, ...user, autoBasket };
  });
};

export const fetchAutoBasketProducts = async (userId) => {
  try {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const autoBasketItems = snap.data().autoBasket?.products || [];
    const { available, archived } = useProductStore.getState();
    const allProducts = [...available, ...archived];

    return autoBasketItems.map(item => {
      const prod = allProducts.find(p => p.id === item.productId);
      return prod ? { ...prod, ...item } : item;
    });
  } catch (err) {
    console.error("Failed to fetch autoBasket items:", err);
    return [];
  }
};

export const updateProductAmountInAutoBasket = async (userId, autoBasketItemId, newAmount) => {
  const ref = doc(db, "users", userId);
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User not found");
    const user = snap.data();
    const autoBasket = user.autoBasket || { products: [] };
    const index = autoBasket.products.findIndex(p => p.autoBasketId === autoBasketItemId);
    if (index === -1) throw new Error("Product not found in autoBasket");

    if (newAmount <= 0) {
      autoBasket.products.splice(index, 1);
    } else {
      autoBasket.products[index].amount = newAmount;
    }

    tx.update(ref, { "autoBasket.products": autoBasket.products });
    return { id: snap.id, ...user, autoBasket };
  });
};

export const removeProductFromAutoBasket = async (userId, autoBasketItemId) => {
  const ref = doc(db, "users", userId);
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User not found");
    const user = snap.data();
    const autoBasket = user.autoBasket || { products: [] };
    const products = autoBasket.products.filter(p => p.autoBasketId !== autoBasketItemId);

    tx.update(ref, { "autoBasket.products": products });
    return { id: snap.id, ...user, autoBasket: { products } };
  });
};

export const updateAutoBasketItemName = async (userId, autoBasketItemId, newName) => {
  const ref = doc(db, "users", userId);
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User not found");
    const user = snap.data();
    const autoBasket = user.autoBasket || { products: [] };
    const index = autoBasket.products.findIndex(p => p.autoBasketId === autoBasketItemId);
    if (index === -1) throw new Error("Item not found in autoBasket");

    autoBasket.products[index].name = newName;
    tx.update(ref, { "autoBasket.products": autoBasket.products });
    return { id: snap.id, ...user, autoBasket };
  });
};
