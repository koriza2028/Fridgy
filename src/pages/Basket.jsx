import React, { useState, useRef, } from 'react';
import { View, ScrollView, Pressable, Text, 
  Dimensions, TouchableWithoutFeedback, Keyboard, StyleSheet } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import SearchInput from '../components/Search';
import SearchModal from '../components/SearchModal';
import BasketItem from '../components/basket/BasketItem';
// import BasketCustomItem from '../components/basket/BasketCustomItem';
import ModalItemInfo from '../components/basket/ModalItemInfo';
import Button_Autobasket from '../components/basket/Button_Autobasket';

import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import { 
  addProductToBasket, 
  updateProductAmountInBasket,
  fetchBasketProducts,
  moveProductsFromBasketToFridge,
  updateBasketItemName
} from '../store/basketStore';

import { fetchAllProducts } from '../store/fridgeStore';

import { useFonts } from 'expo-font';
import { buttonColor, backgroundColor, addButtonColor } from '../../assets/Styles/styleVariables';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function BasketPage({ navigation }) {
  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const userId = useAuthStore((state) => state.user?.uid);
  const logout = useAuthStore((state) => state.logout);

  // Basket now holds an array of enriched basket items with full product details (name, imageUri, etc.)
  const [basket, setBasket] = useState([]);
  const [products, setProducts] = useState([]);
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
        const fridgeProducts = await fetchAllProducts(userId);
        setBasket(basketItems);
        setProducts(fridgeProducts);
      }
    } catch (err) {
      console.error("Failed to fetch basket products:", err);
      setError("Failed to fetch basket.");
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      async function refreshData() {
        await refreshBasket();
      }
      refreshData();
    }, [userId])
  );

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(fridgeProduct =>
        !basket.some(basketProduct => basketProduct.productId === fridgeProduct.id)
      ).filter(product => product.name.toLowerCase().includes(text.toLowerCase()));
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

  const handleUpdateName = async (basketItemId, newName) => {
    await updateBasketItemName(userId, basketItemId, newName);
    await refreshBasket();
  }

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

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const handleItemPress = (product) => {
    setSelectedProduct(product);
    setIsInfoModalVisible(true);
  };

  const combinedData = [
    ...basket.filter(product => !product.isFromFridge),
    ...basket.filter(product => product.isFromFridge),
  ];

  const [openRowKey, setOpenRowKey] = useState(null);

  // Render the hidden row with a delete button
  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDecrementProductAmount(item.basketId, item.amount)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );



  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.BasketPage}>
        <View style={styles.BasketPage_ContentWrapper}>

          {/* <Pressable onPress={() => navigation.navigate('AutoBasketPage')} style={styles.tempButton}>
            <Text style={styles.tempButtonText}>AutoBasket</Text>
          </Pressable> */}

          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>

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

        <SwipeListView
          data={combinedData}
          keyExtractor={(item) => item.basketId.toString()}
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
                  isChecked={!!checkedItems[item.basketId]}
                  onDecrement={() => handleDecrementProductAmount(item.basketId, item.amount)}
                  onAdd={() => handleIncrementProductAmount(item.basketId, item.amount)}
                  onToggleCheckbox={(isChecked) => handleToggleCheckbox(item.basketId, isChecked)}
                  openInfoModal={() => handleItemPress(item)}
                  onChangeName={handleUpdateName}
                  swipeOpen={openRowKey === item.basketId}
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

      <Pressable style={[styles.Button_ShowReceipt]} onPress={handleDisplayCheckedItems} disabled={!isAnyChecked}>
        <MaterialCommunityIcons name={"basket-check"} color={isAnyChecked ? addButtonColor : 'black'} 
          style={styles.basketButtonIcon}
        />
      </Pressable>

      {/* <Pressable style={[styles.Button_GenerateAutobasket]}>
        <Text>A</Text>
      </Pressable> */}
      <Button_Autobasket onAClick={() => navigation.navigate('AutoBasketPage')}/>

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


  BasketPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    width: width,
    alignItems: 'center',
  },
  BasketPage_ContentWrapper: {
    width: width,
  },
  BasketPage_ListOfBasketItems: {
    marginTop: 10,
    // marginHorizontal: 10,
    height: height,
  },
  Button_ShowReceipt: {
    position: 'absolute',
    bottom: 20,
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
  basketButtonIcon: { 
    fontSize: 28, 
    textAlign: 'center', 
    marginTop: 18, 
    width: 50, 
    height: 50,
  },
  // Button_GenerateAutobasket: {
  //   position: 'absolute',
  //   bottom: 30,
  //   right: 10,
  //   flexDirection: 'row',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   width: 50,
  //   height: 50,
  //   paddingVertical: 15,
  //   paddingHorizontal: 15,
  //   marginHorizontal: 10,
  //   backgroundColor: '#FFF',
  //   borderRadius: 60,
  //   borderColor: addButtonColor,
  //   borderWidth: 2,
  //   shadowColor: '#007bff', 
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.4,
  //   shadowRadius: 2,
  //   elevation: 2,        
  // },
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
