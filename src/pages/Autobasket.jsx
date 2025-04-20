// AutoBasketPage.js
import React, { useState, useRef, useCallback } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Pressable, TouchableWithoutFeedback, Keyboard, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';

import useAuthStore from '../store/authStore';
import { fetchAllProducts } from '../store/fridgeStore';
import {
  fetchAutoBasketProducts,
  addProductToAutoBasket,
  updateProductAmountInAutoBasket,
} from '../store/autoBasketStore';

import ModalItemInfo from '../components/basket/ModalItemInfo';
import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/BasketItem';
import { backgroundColor } from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

export default function AutoBasketPage() {
  const userId = useAuthStore((state) => state.user?.uid);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [autoBasket, setAutoBasket] = useState([]);
  const [products, setProducts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const modalSearchRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      refreshAutoBasket();
    }, [userId])
  );

  const refreshAutoBasket = async () => {
      try {
        if (userId) {
          const autoBasketItems = await fetchAutoBasketProducts(userId);
          const fridgeProducts = await fetchAllProducts(userId);
          setAutoBasket(autoBasketItems);
          setProducts(fridgeProducts);
        }
      } catch (err) {
        console.error("Failed to fetch basket products:", err);
        setError("Failed to fetch basket.");
      }
    };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(
        (p) =>
          !autoBasket.some((a) => a.productId === p.id) &&
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

  const addProduct = async (item) => {
    try {
      await addProductToAutoBasket(userId, item);
      closeSearchModal();
      await refreshAutoBasket();
    } catch (err) {
      console.error("Failed to add product:", err);
      setError("Failed to add product. Please try again.");
    }
  };
  
  const handleIncrementProductAmount = async (autoBasketItemId, currentAmount) => {
    try {
      await updateProductAmountInAutoBasket(userId, autoBasketItemId, currentAmount + 1);
      await refreshAutoBasket();
    } catch (err) {
      console.error("Failed to increment product quantity:", err);
    }
  };

  const handleDecrementProductAmount = async (autoBasketItemId, currentAmount) => {
    try {
      await updateProductAmountInAutoBasket(userId, autoBasketItemId, currentAmount - 1);
      await refreshAutoBasket();
    } catch (err) {
      console.error("Failed to decrement product quantity:", err);
    }
    };
  
  const [openRowKey, setOpenRowKey] = useState(null);

  // Render the hidden row with a delete button
  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDecrementProductAmount(item.autoBasketId, item.amount)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );

  const handleItemPress = (product) => {
    setSelectedProduct(product);
    setIsInfoModalVisible(true);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.BasketPage}>
          <View style={styles.BasketPage_ContentWrapper}>

            <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} />
            
            <SearchModal 
              isSearchModalVisible={isSearchModalVisible}
              closeSearchModal={closeSearchModal}
              addProduct={addProduct}
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              filteredData={filteredData}
              isRecipeCreate={true}
            />
            
          <View style={styles.BasketPage_ListOfBasketItems}>

            <SwipeListView
              data={autoBasket}
              keyExtractor={(item) => item.autoBasketId.toString()}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              disableRightSwipe={true}
              onRowOpen={(rowKey) => setOpenRowKey(rowKey)}
              onRowClose={(rowKey) => setOpenRowKey(null)}
              contentContainerStyle={styles.BasketPage_ListOfBasketItems}
              renderItem={({ item }) => (
                <View style={styles.rowFront}>
                  <BasketItem
                    product={item}
                    onDecrement={() => handleDecrementProductAmount(item.autoBasketId, item.amount)}
                    onAdd={() => handleIncrementProductAmount(item.autoBasketId, item.amount)}
                    onToggleCheckbox={(isChecked) => handleToggleCheckbox(item.autoBasketId, isChecked)}
                    openInfoModal={() => handleItemPress(item)}
                    swipeOpen={openRowKey === item.autoBasketId}
                    autobasket={true}
                  />
                </View>
              )}          
            />

          </View>

          <ModalItemInfo 
            isVisible={isInfoModalVisible} 
            onClose={() => setIsInfoModalVisible(false)} 
            selectedProduct={selectedProduct}
          />

        </View>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: backgroundColor,
  },
  rowBack: {
    alignItems: 'center',
    backgroundColor: 'red',
    justifyContent: 'center',
    width: 75,        // Fixed width matching rightOpenValue
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  deleteButton: {
    // paddingHorizontal: 20,
    // paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  WholePage: {
    flex: 1,
    backgroundColor: backgroundColor,
    width: width,
    alignItems: 'center',
  },
  WholePage_ContentWrapper: {
    width: width,
  },
  BasketPage_ListOfBasketItems: {
    marginTop: 10,
    marginBottom: 20,
    // marginHorizontal: 10,
  },
  // controlButtons: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   marginVertical: 10,
  //   gap: 10,
  // },
});
