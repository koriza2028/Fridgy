import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';

import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/BasketItem';
import ModalItemInfo from '../components/basket/ModalItemInfo';

import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import { fetchBasketProducts } from '../store/basketStore';
import { 
  addProductToBasket, 
  updateProductAmountInBasket, 
  removeProductFromBasket, 
  moveProductsFromBasketToFridge 
} from '../store/basketStore';

import { useFonts } from 'expo-font';
import { buttonColor, backgroundColor, addButtonColor } from '../../assets/Styles/styleVariables';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

export default function BasketPage({ navigation }) {
  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const userId = useAuthStore((state) => state.user?.uid);
  const logout = useAuthStore((state) => state.logout);

  // Basket now holds an array of enriched basket items with full product details (name, imageUri, etc.)
  const [basket, setBasket] = useState([]);
  const [error, setError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);

  // Checkbox and receipt states
  const [checkedItems, setCheckedItems] = useState({});
  const isAnyChecked = Object.values(checkedItems).some(isChecked => isChecked);

  const refreshBasket = async () => {
    try {
      if (userId) {
        const basketItems = await fetchBasketProducts(userId);
        setBasket(basketItems);
      }
    } catch (err) {
      console.error("Failed to fetch basket products:", err);
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
      // Here you might search from an external list of products if needed.
      // For simplicity, we clear filtered data when search text is empty.
      setFilteredData([]); 
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

  const addProduct = async (item, isFromFridge) => {
    try {
      await addProductToBasket(userId, item, isFromFridge);
      closeSearchModal();
      await refreshBasket();
    } catch (err) {
      console.error("Failed to add product:", err);
      setError("Failed to add product. Please try again.");
    }
  };

  const handleIncrementProductAmount = async (basketItemId, currentAmount) => {
    try {
      await updateProductAmountInBasket(userId, basketItemId, currentAmount + 1);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to increment product quantity:", err);
    }
  };

  const handleDecrementProductAmount = async (basketItemId, currentAmount) => {
    try {
      await updateProductAmountInBasket(userId, basketItemId, currentAmount - 1);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to decrement product quantity:", err);
    }
  };

  const handleToggleCheckbox = (basketItemId, isChecked) => {
    setCheckedItems(prev => ({
      ...prev,
      [basketItemId]: isChecked,
    }));
  };

  const handleDisplayCheckedItems = async () => {
    if (basket && basket.length > 0) {
      const checkedProducts = basket.filter(product => checkedItems[product.basketId]);
      if (checkedProducts.length > 0) {
        await moveSelectedProducts(checkedProducts);
        setCheckedItems(prev => {
          const updated = { ...prev };
          checkedProducts.forEach(product => delete updated[product.basketId]);
          return updated;
        });
      }
    }
  };

  const moveSelectedProducts = async (selectedProducts) => {
    try {
      const selectedBasketItemIds = selectedProducts.map(product => product.basketId);
      await moveProductsFromBasketToFridge(userId, selectedBasketItemIds);
      await refreshBasket();
    } catch (err) {
      console.error("Failed to move selected products:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemFromFridge, setSelectedItemFromFridge] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const handleItemPress = (basketItemId, isFromFridge) => {
    setSelectedItemId(basketItemId);
    setSelectedItemFromFridge(isFromFridge);
    setIsInfoModalVisible(true);
  };

  return (
    <View style={styles.BasketPage}>
      <ScrollView>
        <View style={styles.BasketPage_ContentWrapper}>
          <TouchableOpacity onPress={() => navigation.navigate('AutobasketPage')} style={styles.tempButton}>
            <Text style={styles.tempButtonText}>Autobasket</Text>
          </TouchableOpacity>

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
            {basket && basket.length > 0 ? (
              basket.map((product) => (
                <BasketItem 
                  key={product.basketId} 
                  product={product} 
                  isChecked={!!checkedItems[product.basketId]}
                  onDecrement={() => handleDecrementProductAmount(product.basketId, product.amount)}
                  onAdd={() => handleIncrementProductAmount(product.basketId, product.amount)}
                  onToggleCheckbox={(isChecked) => handleToggleCheckbox(product.basketId, isChecked)}
                  openInfoModal={() => handleItemPress(product.basketId, product.isFromFridge)}
                />
              ))
            ) : (<View />)}
          </View>

          <ModalItemInfo 
            isVisible={isInfoModalVisible} 
            onClose={() => setIsInfoModalVisible(false)} 
            // itemId={selectedItemId} 
            // isFridge={selectedItemFromFridge}
            itemId={selectedProduct?.id}
            isFridge={selectedProduct?.isFromFridge}
            selectedProduct={selectedProduct}
          />
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.Button_ShowReceipt]} onPress={handleDisplayCheckedItems} disabled={!isAnyChecked}>
        <Text style={styles.Button_ShowReceipt_Text}><MaterialCommunityIcons name={"basket-check"} size={32} color={isAnyChecked ? addButtonColor : 'black'} /></Text>
      </TouchableOpacity>

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
  Button_ShowReceipt: {
    position: 'absolute',
    bottom: 30,
    left: 10,
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
  tempButton: {
    alignSelf: 'flex-start',
    padding: 10,
    backgroundColor: buttonColor,
    borderRadius: 5,
  },
  tempButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
