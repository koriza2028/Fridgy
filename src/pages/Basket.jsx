import React, { useState, useRef, useCallback } from 'react';
import { View, Pressable, Text, FlatList,
  Dimensions, TouchableWithoutFeedback, Keyboard, StyleSheet, Alert, LayoutAnimation } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import SearchInput from '../components/Search';
import BasketItem from '../components/basket/BasketItem';
import ModalItemInfo from '../components/basket/ModalItemInfo';
import Button_Autobasket from '../components/basket/Button_Autobasket';
import ButtonBouncing from '../components/Button_Bouncing';

import AppImage from '../components/image/AppImage';

import { useFocusEffect } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import useProductStore from '../store/productStore';
import { 
  addProductToBasket, 
  updateProductAmountInBasket,
  fetchBasketProducts,
  moveProductsFromBasketToFridge,
  updateBasketItemName,
  addAutoBasketProductsToBasket,
  removeProductFromBasket
} from '../store/basketStore';

import { useFonts } from 'expo-font';
import { buttonColor, backgroundColor, addButtonColor, SecondTitleFontSize, MainFont } from '../../assets/Styles/styleVariables';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get('window');

export default function BasketPage({ navigation }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });

  const { available, archived } = useProductStore();

  const [basket, setBasket] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);

  const [checkedItems, setCheckedItems] = useState({});
  const isAnyChecked = Object.values(checkedItems).some(Boolean);

  const refreshBasket = async () => {
    if (ctx) {
      const items = await fetchBasketProducts(ctx);
      setBasket(items);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refreshBasket();
    }, [ctx.userId, ctx.familyId])
  );

  // const handleSearch = (text) => {
  //   setSearchQuery(text);
  //   if (text) {
  //     const allProducts = [...available, ...archived];
  //     const results = allProducts.filter(prod =>
  //       !basket.some(b => b.productId === prod.id) &&
  //       prod.name.toLowerCase().includes(text.toLowerCase())
  //     );
  //     setFilteredData(results);
  //   } else {
  //     closeSearchModal();
  //   }
  // };

  const handleSearch = (text) => {
  setSearchQuery(text);
  if (text) {
    const allProducts = [...available, ...archived];
    const results = allProducts.filter(prod =>
      !basket.some(b => b.productId === prod.id) &&
      prod.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(results);
  } else {
    setFilteredData([]);
  }
};

  // const openSearchModal = (text) => {
  //   setSearchQuery(text);
  //   setSearchModalVisible(true);
  //   handleSearch(text);
  //   setTimeout(() => modalSearchRef.current?.focus(), 100);
  // };

  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setFilteredData([]);
  };

  const addProduct = async (item, isFromFridge) => {
    await addProductToBasket(ctx, item, isFromFridge);
    // closeSearchModal();
    await refreshBasket();
  };

  const handleIncrementProductAmount = async (basketItemId, currentAmount) => {
    await updateProductAmountInBasket(ctx, basketItemId, currentAmount + 1);
    await refreshBasket();
  };

  const handleRemoveProductFromBasket = async (basketItemId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const prev = basket;
    setBasket(prev.filter(item => item.basketId !== basketItemId));
    try {
      await removeProductFromBasket(ctx, basketItemId);
    } catch (err) {
      console.error(err);
      setBasket(prev);
    }
  };

  const handleUpdateName = async (basketItemId, newName) => {
    await updateBasketItemName(ctx, basketItemId, newName);
    await refreshBasket();
  };

  const handleToggleCheckbox = (basketItemId, isChecked) => {
    setCheckedItems(prev => ({ ...prev, [basketItemId]: isChecked }));
  };

  const handleDisplayCheckedItems = async () => {
    const checked = basket.filter(p => checkedItems[p.basketId]);
    if (checked.length > 0) {
      await moveProductsFromBasketToFridge(ctx, checked.map(p => p.basketId));
      setCheckedItems({});
      await refreshBasket();
    }
  };

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);

  const handleItemPress = (product) => {
    setSelectedProduct(product);
    setIsInfoModalVisible(true);
  };

  const [openRowKey, setOpenRowKey] = useState(null);

  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <Pressable style={styles.deleteButton} onPress={() => handleRemoveProductFromBasket(item.basketId)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );

  const handleAddAutoBasketToBasket = async () => {
    try {
      const result = await addAutoBasketProductsToBasket(ctx);
      setBasket(result);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not add products from autoBasket");
    }
  };

  const [listKey, setListKey] = useState(Date.now());
    useFocusEffect(
      useCallback(() => {
        setListKey(Date.now()); // force SwipeListView to remount
      }, [])
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.BasketPage}>
        <View style={styles.BasketPage_ContentWrapper}>

          {/* <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} /> */}
          <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={handleSearch} />


          {/* <SearchModal 
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProduct}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            isBasket={true}
          /> */}

          <View style={styles.BasketPage_ListOfBasketItems}>
            {searchQuery.length > 0 ? (
              <FlatList
                data={[...filteredData, searchQuery]}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => {
                  if (typeof item === 'string') {
                    return (
                      <Pressable style={[styles.newItem, styles.searchItem]} onPress={() => addProduct(item, false)}>
                        <Text style={styles.searchItem_Text}>{item}</Text>
                        <Text style={styles.ItemCategoryHint}>Add new item</Text>
                      </Pressable>
                    );
                  } else {
                    return (
                      <Pressable style={[styles.fridgeItem, styles.searchItem]} onPress={() => addProduct(item, true)}>
                        <AppImage 
                          style={styles.searchItem_Image}
                          imageUri={item.imageUri}
                          staticImagePath={item.staticImagePath}
                        />
                        <View style={styles.NameAndHint}>
                          <Text style={styles.searchItem_Text}>{item.name}</Text>
                          <Text style={styles.ItemCategoryHint}>{item.category?.tagName || ''}</Text>
                        </View>
                      </Pressable>
                    );
                  }
                }}
              />
            ) : (
            <SwipeListView
              data={basket}
              keyExtractor={item => item.basketId.toString()}
              key={listKey}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              disableRightSwipe
              onRowOpen={(rowKey) => setOpenRowKey(rowKey)}
              onRowClose={() => setOpenRowKey(null)}
              contentContainerStyle={styles.BasketPage_ListOfBasketItems}
              renderItem={({ item }) => (
                <View style={styles.rowFront}>
                  <BasketItem
                    product={item}
                    isChecked={!!checkedItems[item.basketId]}
                    onDecrement={() => handleRemoveProductFromBasket(item.basketId)}
                    onAdd={() => handleIncrementProductAmount(item.basketId, item.amount)}
                    onToggleCheckbox={(isChecked) => handleToggleCheckbox(item.basketId, isChecked)}
                    openInfoModal={() => handleItemPress(item)}
                    onChangeName={handleUpdateName}
                    swipeOpen={openRowKey === item.basketId}
                  />
                </View>
              )}
            />
          )}
          </View>

          <ModalItemInfo 
            isVisible={isInfoModalVisible} 
            onClose={() => setIsInfoModalVisible(false)} 
            selectedProduct={selectedProduct}
          />

        </View>

        {/* <Pressable style={styles.Button_ShowReceipt} onPress={handleDisplayCheckedItems} disabled={!isAnyChecked}>
          <MaterialCommunityIcons name="basket-check" color={isAnyChecked ? addButtonColor : 'black'} style={styles.basketButtonIcon} />
        </Pressable> */}

        <ButtonBouncing style={[styles.Button_ShowReceipt, { borderWidth: isAnyChecked ? 2 : 0 }]} isDisabled={!isAnyChecked}
          innerStyle={styles.innerStyle} onPress={handleDisplayCheckedItems}
          label={<MaterialCommunityIcons name="basket-check" color={isAnyChecked ? addButtonColor : 'black'} style={styles.basketButtonIcon}/>}
        />

        <Button_Autobasket onAClick={() => navigation.navigate('AutoBasketPage')} onGClick={handleAddAutoBasketToBasket} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: backgroundColor,
  },
  rowBack: {
    alignItems: 'flex-end',
    backgroundColor: 'red',
    justifyContent: 'center',
    width: 75,
    position: 'absolute',
    right: -10,
    top: 0,
    bottom: 0,
  },
  deleteButton: {
    paddingRight: 20,
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
    // borderWidth: 2,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  innerStyle: { 
    borderRadius: 60, 
    width: 50,
    height: 50,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  basketButtonIcon: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 18,
    width: 50,
    height: 50,
  },



  innerPressable: {
      borderRadius: 6
    },
    flatList: {
      marginTop: 8,
    },
    searchItem: {
      padding: 10,
      marginHorizontal: 10,
      borderRadius: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    fridgeItem: { 
      flexDirection: 'row',
    },
    newItem: {
      backgroundColor: '#eee',
    },
    mealItem: {
      padding: 10,
      marginBottom: 10,
      borderRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      flexDirection: 'row',
      // backgroundColor: '#fff',
      // alignItems: 'center',
    },
    ItemCategoryTag: {
      height: 20,
    },
    searchItem_Image: {
      width: 50,
      height: 50,
      borderRadius: 8,
    },
    NameAndHint: {
      flexDirection: 'column',
      marginLeft: 16,
    },
    searchItem_Text: {
      fontSize: SecondTitleFontSize,
      fontFamily: MainFont,
    },
    ItemCategoryHint: {
      paddingTop: 10,
      fontSize: 12,
      fontFamily: MainFont,
    },
});
