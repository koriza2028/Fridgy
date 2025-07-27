import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { storage } from "../firebaseConfig";
import useNotificationsStore from './notificationsStore';
import useProductStore from './productStore';
import {
  getProductDocRef,
  getFridgeCollectionRef,
  getDataRef
} from "./utilsStore";

export const fetchAllProducts = async (ctx) => {
  try {
    const productsColRef = getFridgeCollectionRef(ctx);
    const querySnapshot = await getDocs(productsColRef);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const fetchAvailableProducts = async (ctx) => {
  const all = await fetchAllProducts(ctx);
  return all.filter(p => p.isArchived === false);
};

export const fetchArchivedProducts = async (ctx) => {
  const all = await fetchAllProducts(ctx);
  return all.filter(p => p.isArchived === true);
};

export const addOrUpdateProduct = async (ctx, productDataId, productData) => {
  try {
    const productId = productDataId || Date.now().toString();
    const productDocRef = getProductDocRef(ctx, productId);

    if (productDataId) {
      const productSnap = await getDoc(productDocRef);
      if (productSnap.exists()) {
        const oldUri = productSnap.data().imageUri;
        const newUri = productData.imageUri;
        if (oldUri && (!newUri || oldUri !== newUri)) {
          try { await deleteObject(storageRef(storage, oldUri)); }
          catch (err) { console.warn("⚠️ Failed to delete old image:", err); }
        }
      }
      await updateDoc(productDocRef, productData);
    } else {
      await setDoc(productDocRef, productData);
    }

    const updated = await fetchAvailableProducts(ctx);
    useProductStore.setState({ available: updated });
    return updated;
  } catch (error) {
    console.error("Error adding/updating product:", error);
    return [];
  }
};

export const decrementProductAmount = async (ctx, productId) => {
  try {
    const ref = getProductDocRef(ctx, productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const updatedAmount = Math.max((data.amount || 0) - 1, 0);
    const isArchived = updatedAmount === 0;

    await updateDoc(ref, { amount: updatedAmount, isArchived });

    useProductStore.setState(state => ({
      available: state.available.map(p =>
        p.id === productId ? { ...p, amount: updatedAmount, isArchived } : p
      )
    }));

    useNotificationsStore.getState().fetchNotifications(ctx);
  } catch (error) {
    console.error("Error decrementing product amount:", error);
  }
};

export const incrementProductAmount = async (ctx, productId) => {
  try {
    const ref = getProductDocRef(ctx, productId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const updatedAmount = (data.amount || 0) + 1;

    await updateDoc(ref, { amount: updatedAmount, isArchived: false });

    useProductStore.setState(state => ({
      available: state.available.map(p =>
        p.id === productId ? { ...p, amount: updatedAmount, isArchived: false } : p
      )
    }));

    useNotificationsStore.getState().fetchNotifications(ctx);
  } catch (error) {
    console.error("Error incrementing product amount:", error);
  }
};

export const deleteProduct = async (ctx, productId) => {
  try {
    const rootRef = getDataRef(ctx);
    const rootSnap = await getDoc(rootRef);
    if (!rootSnap.exists()) return;

    const userData = rootSnap.data();
    const recipes = userData.recipes || [];
    const basketRefs = userData.basket?.products || [];

    const usedInRecipes = recipes.some(r =>
      [...(r.mandatoryIngredients || []), ...(r.optionalIngredients || [])].some(i => i.id === productId)
    );

    const usedInBasket = basketRefs.some(p => p.productId === productId);

    if (usedInRecipes || usedInBasket) {
      throw new Error("This product is used in a recipe or basket and cannot be deleted.");
    }

    const ref = getProductDocRef(ctx, productId);
    const snap = await getDoc(ref);
    const imgPath = snap.exists() ? snap.data()?.imageUri : null;

    await deleteDoc(ref);
    if (imgPath) {
      try { await deleteObject(storageRef(storage, imgPath)); }
      catch (err) { console.warn("⚠️ Failed to delete image:", err); }
    }

    const updated = await fetchAvailableProducts(ctx);
    useProductStore.setState({ available: updated });
    return updated;
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

export const addOrMoveProductToBasket = async (ctx, productInput) => {
  const rootRef = getDataRef(ctx);

  return await runTransaction(rootRef.firestore, async (tx) => {
    const rootDoc = await tx.get(rootRef);
    if (!rootDoc.exists()) throw new Error("User/family doc does not exist");

    const rootData = rootDoc.data();
    let basketRefs = rootData.basket?.products || [];

    const productId = productInput.productId || productInput.id;
    const index = basketRefs.findIndex(p => p.productId === productId);

    if (index !== -1) {
      basketRefs[index].amount += 1;
    } else {
      basketRefs.push({
        basketId: Date.now().toString(),
        productId,
        amount: 1,
        isFromFridge: true,
      });
    }

    tx.update(rootRef, { "basket.products": basketRefs });
    return { id: rootDoc.id, ...rootData, basket: { products: basketRefs } };
  });
};

export const moveProductToBasket = async (ctx, productId) => {
  const ref = getProductDocRef(ctx, productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Product not found in the store");
  const data = snap.data();
  return await addOrMoveProductToBasket(ctx, { ...data, id: productId });
};
