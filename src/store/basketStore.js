import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import useProductStore from './productStore';
import { getDataRef, getFridgeCollectionRef } from './utilsStore';

const normalizeProduct = (product) =>
  typeof product === 'string'
    ? { id: product, name: product, amount: 1, isFromFridge: false }
    : { id: product.id, name: product.name, amount: 1, isFromFridge: true };

export const fetchUserData = async ({ userId, familyId }) => {
  const ref = getDataRef({ userId, familyId });
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const data = { basket: { products: [] } };
    await setDoc(ref, data);
    return { id: familyId || userId, ...data };
  }
  return { id: snap.id, ...snap.data() };
};

export const addProductToBasket = async ({ userId, familyId }, productInput, isFromFridge) => {
  const product = isFromFridge
    ? { basketId: Date.now().toString(), productId: productInput.id, amount: 1, isFromFridge: true }
    : {
        basketId: Date.now().toString(),
        ...normalizeProduct(productInput),
        productId: productInput.id || productInput,
        isFromFridge: false,
      };

  const ref = getDataRef({ userId, familyId });
  return await runTransaction(db, async (tx) => {
    const docSnap = await tx.get(ref);
    if (!docSnap.exists()) throw new Error("User/family not found");

    const data = docSnap.data();
    const basket = data.basket || { products: [] };

    const index = basket.products.findIndex(p =>
      product.isFromFridge ? p.productId === product.productId : p.basketId === product.basketId
    );

    if (index !== -1) {
      basket.products[index].amount += 1;
    } else {
      basket.products.push(product);
    }

    tx.update(ref, { "basket.products": basket.products });
    return { id: docSnap.id, ...data, basket };
  });
};

export const updateProductAmountInBasket = async ({ userId, familyId }, basketItemId, newAmount) => {
  const ref = getDataRef({ userId, familyId });
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User/family not found");
    const data = snap.data();
    const basket = data.basket || { products: [] };
    const index = basket.products.findIndex(p => p.basketId === basketItemId);
    if (index === -1) throw new Error("Product not found in basket");

    if (newAmount <= 0) {
      basket.products.splice(index, 1);
    } else {
      basket.products[index].amount = newAmount;
    }

    tx.update(ref, { "basket.products": basket.products });
    return { id: snap.id, ...data, basket };
  });
};

export const removeProductFromBasket = async ({ userId, familyId }, basketItemId) => {
  const ref = getDataRef({ userId, familyId });
  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User/family not found");
    const data = snap.data();
    const products = (data.basket?.products || []).filter(p => p.basketId !== basketItemId);
    tx.update(ref, { "basket.products": products });
    return { id: snap.id, ...data, basket: { products } };
  });
};

export const fetchBasketProducts = async ({ userId, familyId }) => {
  try {
    const ref = getDataRef({ userId, familyId });
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];

    const basketItems = snap.data().basket?.products || [];
    const { available, archived } = useProductStore.getState();
    const allProducts = [...available, ...archived];

    return basketItems.map(item => {
      const prod = allProducts.find(p => p.id === item.productId);
      return prod ? { ...prod, ...item } : item;
    });
  } catch (err) {
    console.error("Failed to fetch basket items:", err);
    return [];
  }
};

export const addAutoBasketProductsToBasket = async ({ userId, familyId }) => {
  const ref = getDataRef({ userId, familyId });

  const updated = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User/family not found");
    const data = snap.data();
    const auto = data.autoBasket?.products || [];
    const current = data.basket?.products || [];
    const existing = new Set(current.map(p => p.productId));

    const newItems = auto
      .filter(p => !existing.has(p.productId))
      .map(p => ({
        ...p,
        basketId: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        amount: 1,
      }));

    const merged = [...current, ...newItems];
    tx.update(ref, { "basket.products": merged });
    return merged;
  });

  const { available, archived } = useProductStore.getState();
  const allProducts = [...available, ...archived];
  return updated.map(item => {
    const prod = allProducts.find(p => p.id === item.productId);
    return prod ? { ...prod, ...item } : item;
  });
};

export const clearBasket = async ({ userId, familyId }) => {
  const ref = getDataRef({ userId, familyId });
  await updateDoc(ref, { "basket.products": [] });
  return [];
};

export const moveProductsFromBasketToFridge = async ({ userId, familyId }, basketItemIds = []) => {
  const ref = getDataRef({ userId, familyId });
  const fridgeRef = getFridgeCollectionRef({ userId, familyId });

  return await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("User/family not found");

    const data = snap.data();
    const basket = data.basket?.products || [];
    const updatedBasket = [];

    for (const item of basket) {
      if (basketItemIds.includes(item.basketId)) {
        const productRef = doc(fridgeRef, item.productId);
        const existingSnap = await getDoc(productRef);

        if (existingSnap.exists()) {
          const current = existingSnap.data();
          await tx.update(productRef, {
            amount: (current.amount || 0) + (item.amount || 1),
            isArchived: false,
          });
        } else {
          await tx.set(productRef, {
            name: item.name || '',
            amount: item.amount || 1,
            isArchived: false,
            createdAt: Date.now(),
          });
        }
      } else {
        updatedBasket.push(item);
      }
    }

    tx.update(ref, { "basket.products": updatedBasket });
    return updatedBasket;
  });
};
