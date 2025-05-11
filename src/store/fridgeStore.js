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
import { db, storage } from "../firebaseConfig";
import useNotificationsStore from './notificationsStore';
import useProductStore from './productStore';

export const fetchAllProducts = async (userId) => {
  try {
    const productsColRef = collection(db, "users", userId, "products");
    const querySnapshot = await getDocs(productsColRef);
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

export const fetchAvailableProducts = async (userId) => {
  const all = await fetchAllProducts(userId);
  return all.filter(p => p.isArchived === false);
};

export const fetchArchivedProducts = async (userId) => {
  const all = await fetchAllProducts(userId);
  return all.filter(p => p.isArchived === true);
};

export const addOrUpdateProduct = async (userId, productDataId, productData) => {
  try {
    const productId = productDataId || Date.now().toString();
    const productDocRef = doc(db, "users", userId, "products", productId);

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

    const updated = await fetchAvailableProducts(userId);
    useProductStore.setState({ available: updated });
    return updated;
  } catch (error) {
    console.error("Error adding/updating product:", error);
    return [];
  }
};

export const decrementProductAmount = async (userId, productId) => {
  try {
    const ref = doc(db, "users", userId, "products", productId);
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

    useNotificationsStore.getState().fetchNotifications(userId);
  } catch (error) {
    console.error("Error decrementing product amount:", error);
  }
};

export const incrementProductAmount = async (userId, productId) => {
  try {
    const ref = doc(db, "users", userId, "products", productId);
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

    useNotificationsStore.getState().fetchNotifications(userId);
  } catch (error) {
    console.error("Error incrementing product amount:", error);
  }
};

export const deleteProduct = async (userId, productId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const recipes = userData.recipes || [];
    const basketRefs = userData.basket?.products || [];

    const usedInRecipes = recipes.some(r => [...(r.mandatoryIngredients || []), ...(r.optionalIngredients || [])].some(i => i.id === productId));
    const usedInBasket = basketRefs.some(p => p.productId === productId);

    if (usedInRecipes || usedInBasket) {
      throw new Error("This product is used in a recipe or basket and cannot be deleted.");
    }

    const ref = doc(db, "users", userId, "products", productId);
    const snap = await getDoc(ref);
    const imgPath = snap.exists() ? snap.data()?.imageUri : null;

    await deleteDoc(ref);
    if (imgPath) {
      try { await deleteObject(storageRef(storage, imgPath)); } 
      catch (err) { console.warn("⚠️ Failed to delete image:", err); }
    }

    const updated = await fetchAvailableProducts(userId);
    useProductStore.setState({ available: updated });
    return updated;
  } catch (error) {
    console.error("Error deleting product:", error);
    return [];
  }
};

export const addOrMoveProductToBasket = async (userId, productInput) => {
  const userRef = doc(db, "users", userId);
  return await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists()) throw new Error("User document does not exist");

    const userData = userDoc.data();
    let basketRefs = userData.basket?.products || [];

    const productId = productInput.productId || productInput.id;
    const index = basketRefs.findIndex((p) => p.productId === productId);

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

    transaction.update(userRef, { "basket.products": basketRefs });
    return { id: userDoc.id, ...userData, basket: { products: basketRefs } };
  });
};

export const moveProductToBasket = async (userId, productId) => {
  const ref = doc(db, "users", userId, "products", productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Product not found in the centralized store");
  const data = snap.data();
  return await addOrMoveProductToBasket(userId, { ...data, id: productId });
};
