import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/BasketItem';
import ModalBasketReceipt from '../components/basket/ModalBasketReceipt';
import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import { fetchUserFridgeProducts } from '../store/fridgeStore';
import { 
  fetchUserData,  // updated from fetchUserBasket to fetchUserData
  addProductToBasket, 
  updateProductAmountInBasket, 
  removeProductFromBasket, 
  moveProductsFromBasketToFridge 
} from '../store/basketStore';

import { buttonColor, backgroundColor } from '../../assets/Styles/styleVariables';
const { width } = Dimensions.get('window');

export default function BasketPage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);

  const [basket, setBasket] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);

  // Checkbox and receipt states
  const [checkedItems, setCheckedItems] = useState({});
  const [modalReceiptVisible, setModalReceiptVisible] = useState(false);
  const [receiptProducts, setReceiptProducts] = useState([]);

  const refreshBasket = async () => {
    try {
      if (userId) {
        // Fetch user data (which includes basket and fridge).
        const userData = await fetchUserData(userId);
        // Update basket state with user's basket.
        setBasket(userData.basket);
        
        // Fetch fridge products for the user.
        const fetchedFridgeProducts = await fetchUserFridgeProducts(userId);
        
        // Filter out products already added in the basket.
        let availableProducts = [];
        if (userData && userData.basket && userData.basket.products) {
          availableProducts = fetchedFridgeProducts.filter(fridgeProduct =>
            !userData.basket.products.some(basketProduct => basketProduct.id === fridgeProduct.id)
          );
        } else {
          availableProducts = fetchedFridgeProducts;
        }
        
        // Update state with the available fridge products.
        setProducts(availableProducts);
      }
    } catch (err) {
      console.error("Failed to fetch basket or fridge products:", err);
      setError("Failed to fetch basket.");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshBasket();
    }, [userId])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(item =>
        item.name.toLowerCase().includes(text.toLowerCase())
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

  const addProduct = async (item) => {
    try {
      await addProductToBasket(userId, item);
      closeSearchModal();
      await refreshBasket();
    } catch (err) {
      console.error("Failed to add product:", err);
      setError("Failed to add product. Please try again.");
    }
  };

  const incrementProductAmount = async (productId, currentAmount) => {
    try {
      const newAmount = currentAmount + 1;
      await updateProductAmountInBasket(userId, productId, newAmount);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to increment product quantity:", err);
    }
  };

  const decrementProductAmount = async (productId, currentAmount) => {
    try {
      const newAmount = currentAmount - 1;
      await updateProductAmountInBasket(userId, productId, newAmount);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to decrement product quantity:", err);
    }
  };

  const removeProduct = async (productId) => {
    try {
      await removeProductFromBasket(userId, productId);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to remove product:", err);
      setError("Failed to remove product. Please try again.");
    }
  };

  const handleToggleCheckbox = (id, isChecked) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: isChecked,
    }));
  };

  const handleDisplayCheckedItems = () => {
    if (basket && basket.products) {
      const checkedProducts = basket.products.filter(product => checkedItems[product.id]);
      setReceiptProducts(checkedProducts);
      setModalReceiptVisible(true);
    }
  };

  const moveSelectedProducts = async () => {
    try {
      const selectedProductIds = receiptProducts.map(product => product.id);
      await moveProductsFromBasketToFridge(userId, selectedProductIds);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to move selected products:", err);
    }
  };

  return (
    <View style={styles.BasketPage}>
      <ScrollView>
        <View style={styles.BasketPage_ContentWrapper}>
          <SearchInput 
            placeholder="Find a product"
            query={searchQuery}
            onChangeText={openSearchModal}
          />
          <SearchModal 
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProduct}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            isBasket={true}
          />
          <View style={styles.BasketPage_ListOfBasketItems}>
            {basket && basket.products && basket.products.length > 0 ? (
              basket.products.map((product, index) => (
                <BasketItem 
                  key={index}
                  product={product}
                  isChecked={!!checkedItems[product.id]}
                  onDecrement={decrementProductAmount}
                  onAdd={incrementProductAmount}
                  onToggleCheckbox={handleToggleCheckbox}
                />
              ))
            ) : (
              <View />
            )}
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity 
        style={[styles.Button_ShowReceipt]} 
        onPress={handleDisplayCheckedItems}
      >
        <Text style={styles.Button_ShowReceipt_Text}>Move items to Fridge</Text>
      </TouchableOpacity>
      <ModalBasketReceipt
        visible={modalReceiptVisible}
        receiptItems={receiptProducts}
        onClose={() => setModalReceiptVisible(false)}
        onMove={moveSelectedProducts}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  BasketPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    width: width,
    alignItems: 'center',
  },
  BasketPage_ContentWrapper: {
    // paddingTop: 20,
    width: width * 0.96,
    // height: height, 
    // NEED TO CHECK WHAT"S UP WITH HEIGHT WHEN THERE ARE A LOT OF PRODUCTS
    // borderColor: '#C0C0C0',
    // borderWidth: 1,
  },
  BasketPage_ListOfBasketItems: {
    // backgroundColor: 'green',
  },
  modal: {
    margin: 0, // No margin for full-screen modal
    justifyContent: 'start',
    backgroundColor: 'white',
    paddingTop: 20,
  },
  modalContent: {
    padding: 16,
  },
  flatList: {
    marginTop: 8,
  },
  Button_ShowReceipt: {
    marginVertical: 5,
    marginHorizontal: 2,
    paddingLeft: 14,
    justifyContent: 'center',
    // borderRadius: 30,
    borderColor: '#C0C0C0',
    // borderWidth: 1,
    height: 50,
    backgroundColor: buttonColor,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '60%',
    position: 'absolute',
    top: '90%',
    borderRadius: 30,
    shadowColor: buttonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4, 
  },
  Button_ShowReceipt_Text: {
    fontWeight: 'bold',
  },
});