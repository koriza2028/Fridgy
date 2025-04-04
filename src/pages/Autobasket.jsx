// AutoBasketPage.js
import React, { useState, useRef, useCallback } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Button, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import useAuthStore from '../store/authStore';
import { fetchAllProducts } from '../store/fridgeStore';
import {
  fetchAutoBasketProducts,
  saveAutoBasketDraft,
  updateProductAmountInAutoBasket,
  updateAutoBasketItemName,
} from '../store/autoBasketStore';

import ModalItemInfo from '../components/basket/ModalItemInfo';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/AutobasketItem';
import { backgroundColor } from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

export default function AutoBasketPage() {
  const userId = useAuthStore((state) => state.user?.uid);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [autoBasket, setAutoBasket] = useState([]);
  const [products, setProducts] = useState([]);
  const [autoBasketDraft, setAutoBasketDraft] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const modalSearchRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [userId])
  );

  const loadProducts = async () => {
    if (userId) {
      const autoBasketItems = await fetchAutoBasketProducts(userId);
      const fridgeProducts = await fetchAllProducts(userId);
      setAutoBasket(autoBasketItems);
      setProducts(fridgeProducts);
      setAutoBasketDraft([]);
      setEditMode(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(
        (p) =>
          !autoBasket.some((a) => a.productId === p.id) &&
          !autoBasketDraft.some((d) => d.productId === p.id) &&
          p.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    } else {
      closeSearchModal();
    }
  };

  const openSearchModal = (text) => {
    setSearchQuery(text);
    setSearchModalVisible(true);
    handleSearch(text);
    setTimeout(() => {
      modalSearchRef.current?.focus();
    }, 100);
  };

  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setFilteredData([]);
  };

  const addProductToDraft = (item) => {
    setAutoBasketDraft((prev) => {
      const exists = prev.find((p) => p.productId === item.id);
      if (exists) {
        return prev.map((p) =>
          p.productId === item.id ? { ...p, amount: p.amount + 1 } : p
        );
      } else {
        return [...prev, { productId: item.id, amount: 1, basketId: Date.now().toString() }];
      }
    });
    setEditMode(true);
    closeSearchModal();
  };

  const handleSaveDraft = async () => {
    await saveAutoBasketDraft(userId, autoBasketDraft);
    await loadProducts();
    setEditMode(false); // Add this line
  };
  

  const handleIncrementProductAmount = async (id, current) => {
    await updateProductAmountInAutoBasket(userId, id, current + 1);
    await loadProducts();
  };

  const handleDecrementProductAmount = async (id, current) => {
    await updateProductAmountInAutoBasket(userId, id, current - 1);
    await loadProducts();
  };

  const handleUpdateName = async (id, name) => {
    await updateAutoBasketItemName(userId, id, name);
    await loadProducts();
  };

  const combinedItems = editMode
    ? [...autoBasket, ...autoBasketDraft.map((d) => ({ ...d, isDraft: true }))]
    : autoBasket;

  return (
    <View style={styles.WholePage}>
      <ScrollView>
        <View style={styles.WholePage_ContentWrapper}>
          <SearchInput
            placeholder="Find a product"
            query={searchQuery}
            onChangeText={openSearchModal}
          />

          {editMode && (
            <View style={styles.controlButtons}>
              <Button title="Save" onPress={handleSaveDraft} />
              <Button title="Cancel" color="red" onPress={() => {
                setAutoBasketDraft([]);
                setEditMode(false); // Add this line
              }}
              />
            </View>
          )}

          <View style={styles.BasketPage_ListOfBasketItems}>
            {combinedItems.map((product) => (
              <BasketItem
                key={product.basketId}
                product={product}
                isChecked={false}
                onDecrement={() => handleDecrementProductAmount(product.basketId, product.amount)}
                onAdd={() => handleIncrementProductAmount(product.basketId, product.amount)}
                onToggleCheckbox={() => {}}
                openInfoModal={() => setSelectedProduct(product)}
                onChangeName={handleUpdateName}
              />
            ))}
          </View>

          <SearchModal
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProductToDraft}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            isRecipeCreate={true}
          />

          <ModalItemInfo
            isVisible={isInfoModalVisible}
            onClose={() => setIsInfoModalVisible(false)}
            selectedProduct={selectedProduct}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  WholePage: {
    flex: 1,
    backgroundColor: backgroundColor,
    width: width,
    alignItems: 'center',
  },
  WholePage_ContentWrapper: {
    width: width * 0.96,
  },
  BasketPage_ListOfBasketItems: {
    marginTop: 10,
    marginBottom: 20,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
});
