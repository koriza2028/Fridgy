import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';

import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/BasketItem';
import ModalItemInfo from '../components/basket/ModalItemInfo';
import ModalBasketReceipt from '../components/basket/ModalBasketReceipt';

import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import { fetchAvailableProducts } from '../store/fridgeStore';
import { 
  fetchUserData,  // updated from fetchUserBasket to fetchUserData
  addProductToBasket, 
  updateProductAmountInBasket, 
  removeProductFromBasket, 
  moveProductsFromBasketToFridge 
} from '../store/basketStore';

import { buttonColor, backgroundColor, addButtonColor } from '../../assets/Styles/styleVariables';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

export default function BasketPage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);
  const logout = useAuthStore((state) => state.logout);

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
        const fetchedFridgeProducts = await fetchAvailableProducts(userId);
        
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
      await addProductToBasket(userId, item, isFromFridge);
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

  const handleDisplayCheckedItems = async () => {
    if (basket && basket.products) {
      const checkedProducts = basket.products.filter(product => checkedItems[product.id]);
      
      if (checkedProducts.length > 0) {
        await moveSelectedProducts(checkedProducts);
        
        // Uncheck moved items
        setCheckedItems(prev => {
          const updatedCheckedItems = { ...prev };
          checkedProducts.forEach(product => delete updatedCheckedItems[product.id]);
          return updatedCheckedItems;
        });
      }
    }
  };

  const moveSelectedProducts = async (selectedProducts) => {
    try {
      const selectedProductIds = selectedProducts.map(product => product.id);
      await moveProductsFromBasketToFridge(userId, selectedProductIds);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to move selected products:", err);
    }
  };

  // New logout handler and button
  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigation.navigate('Login'); // Adjust the route name as needed
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemFromFridge, setSelectedItemFromFridge] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const handleItemPress = (id, isFromFridge) => {
    setSelectedItemId(id);
    setSelectedItemFromFridge(isFromFridge);
    setIsInfoModalVisible(true);
  };

  return (
    <View style={styles.BasketPage}>
      <ScrollView>
        <View style={styles.BasketPage_ContentWrapper}>

          {/* Logout Button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>

          <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} />
          
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
                  key={index} product={product} isChecked={!!checkedItems[product.id]}
                  onDecrement={decrementProductAmount} onAdd={incrementProductAmount} onToggleCheckbox={handleToggleCheckbox} openInfoModal={handleItemPress}/>
              ))
            ) : (<View /> )}
          </View>

          <ModalItemInfo 
            isVisible={isInfoModalVisible} 
            onClose={() => setIsInfoModalVisible(false)} 
            itemId={selectedItemId} 
            isFridge={selectedItemFromFridge}
          />

        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.Button_ShowReceipt]} 
        onPress={handleDisplayCheckedItems} 
        // onPress={moveSelectedProducts}
        >
        <Text style={styles.Button_ShowReceipt_Text}>Go</Text>
      </TouchableOpacity>

      {/* <ModalBasketReceipt visible={modalReceiptVisible} receiptItems={receiptProducts} onClose={() => setModalReceiptVisible(false)} onMove={moveSelectedProducts} /> */}

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
    width: width * 0.96,
  },
  BasketPage_ListOfBasketItems: {
    marginTop: 10,
  },
  modal: {
    margin: 0,
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
    position: 'absolute',
    bottom: 20,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    backgroundColor: '#FFF',
    borderRadius: 60,
    borderColor: addButtonColor,
    borderWidth: 2,
    
    shadowColor: '#007bff', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,        
  },
  Button_ShowReceipt_Text: {
    fontWeight: 'bold',
  },
  logoutButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 10,
    backgroundColor: buttonColor,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
