import React, { useState } from 'react';
import { View, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import useAuthStore from '../store/authStore';
import { fetchAllProducts } from '../store/fridgeStore';
import { 
  addProductToAutoBasket, 
  updateProductAmountInAutoBasket,
  fetchAutoBasketProducts,
  updateAutoBasketItemName
} from '../store/autoBasketStore';

import ModalItemInfo from '../components/basket/ModalItemInfo';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import { backgroundColor } from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

export default function AutobasketPage({ navigation }) {

  const userId = useAuthStore((state) => state.user?.uid);

  // State for search and modal visibility
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  
  // State for products loaded from your DB
    const [autoBasket, setAutoBasket] = useState([]);
  const [products, setProducts] = useState([]);
  const modalSearchRef = React.useRef(null);

  // This flag disables the ability to create new products if not found in the DB
  const allowNewProduct = false;


  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [userId])
  );

  const loadProducts = async () => {
    if (userId) {
      const autoBasketItems = await fetchAutoBasketProducts(userId);
      const fridgeProducts = await fetchAllProducts(userId);
      setAutoBasket(autoBasketItems);
      setProducts(fridgeProducts);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    console.log('Search text:', text);
    if (text) {
      const results = products.filter(fridgeProduct =>
          !autoBasket.some(autoBasketProduct => autoBasketProduct.productId === fridgeProduct.id)
        ).filter(product => 
          product.name.toLowerCase().includes(text.toLowerCase())
        );
        console.log(results);
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

  // Close the search modal and reset states
  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setFilteredData([]);
  };

  // Add product only from the DB
  const addProduct = async (item, isFromFridge) => {
      try {
        await addProductToAutoBasket(userId, item, isFromFridge);
        closeSearchModal();
        await loadProducts();
      } catch (err) {
        console.error("Failed to add product:", err);
        setError("Failed to add product. Please try again.");
      }
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  
  const handleItemPress = (product) => {
    setSelectedProduct(product);
    setIsInfoModalVisible(true);
  };
  
  const handleIncrementProductAmount = async (basketItemId, currentAmount) => {
    try {
      await updateProductAmountInAutoBasket(userId, basketItemId, currentAmount + 1);
      await loadProducts();
    } catch (err) {
      console.error("Failed to increment product quantity:", err);
    }
  };

  const handleDecrementProductAmount = async (basketItemId, currentAmount) => {
    try {
      await updateProductAmountInAutoBasket(userId, basketItemId, currentAmount - 1);
      await loadProducts();
    } catch (err) {
      console.error("Failed to decrement product quantity:", err);
    }
  };

  const handleUpdateName = async (basketItemId, newName) => {
    await updateAutoBasketItemName(userId, basketItemId, newName);
    await loadProducts();
  }

  return (
    <View style={styles.WholePage}>
      <ScrollView>
        <View style={styles.WholePage_ContentWrapper}>
          <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} />

          {/* <View style={styles.BasketPage_ListOfBasketItems}>
              {basket && basket.length > 0 ? (
                basket.map((product) => (
                  <BasketItem 
                    key={product.basketId} 
                    product={product} 
                    isChecked={!!checkedItems[product.basketId]}
                    onDecrement={() => handleDecrementProductAmount(product.basketId, product.amount)}
                    onAdd={() => handleIncrementProductAmount(product.basketId, product.amount)}
                    onToggleCheckbox={(isChecked) => handleToggleCheckbox(product.basketId, isChecked)}
                    openInfoModal={() => handleItemPress(product)}
                    onChangeName={handleUpdateName}
                  />
                ))
              ) : (<View />)}
            </View> */}
          
          <SearchModal 
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProduct}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            // isBasket={true}
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
});
