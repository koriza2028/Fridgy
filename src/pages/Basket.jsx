import React, { useState, useRef, useCallback } from 'react';
import { View, Pressable, Text, FlatList, Image,
  Dimensions, TouchableWithoutFeedback, Keyboard, StyleSheet, Alert, LayoutAnimation } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

import Entypo from 'react-native-vector-icons/Entypo';

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
import { buttonColor, backgroundColor, addButtonColor, SecondTitleFontSize, MainFont, deleteButtonColor } from '../../assets/Styles/styleVariables';
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



  const addProduct = async (item, isFromFridge) => {
    await addProductToBasket(ctx, item, isFromFridge);
    setSearchQuery('');
    setFilteredData([]);
    Keyboard.dismiss(); // optional, hides the keyboard
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
        {/* <Text style={styles.deleteButtonText}>Delete</Text> */}
        <Entypo name="trash" size={28} style={styles.deleteButtonText}/>
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

          <View style={styles.BasketPage_ListOfBasketItems}>
            {searchQuery.length > 0 ? (
              <FlatList
                data={[...filteredData, searchQuery]}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => {
                  if (typeof item === 'string') {
                    return (
                      <ButtonBouncing 
                        style={{borderRadius: 6}} 
                        onPress={() => addProduct(item, false)}
                        label={
                          <View style={[styles.newItem, styles.searchItem]}>
                            <Text style={styles.searchItem_Text}>{`${item}`}</Text>
                            <Text style={styles.ItemCategoryHint}>Add new item</Text>
                          </View>
                        } toScale={0.95}
                        />
                    );
                  } else {
                    return (
                      <ButtonBouncing 
                        style={{borderRadius: 6}} 
                        onPress={() => addProduct(item, true)}
                        label={
                          <View style={[styles.fridgeItem, styles.searchItem]}>
                            <AppImage 
                              style={styles.searchItem_Image}
                              imageUri={item.imageUri}
                              staticImagePath={item.staticImagePath}
                            />
                            <View style={styles.NameAndHint}>
                              <Text style={styles.searchItem_Text}>{item.name}</Text>
                              <Text style={styles.ItemCategoryHint}>{item.category?.tagName || ''}</Text>
                            </View>
                          </View>
                        } toScale={0.95}
                      />
                    );
                  }
                }}
              />
            ) : basket.length > 0 ? (
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
            ) : (
            <View style={{ alignItems: 'center', position: 'absolute', width: width, top: height*0.218, paddingLeft: 10,}}>
              <Image
                source={require('../../assets/ProductImages/emptyBasket.png')}
                style={{ width: 184, height: 184, resizeMode: 'contain' }}
              />
              <Text style={{ fontFamily: MainFont, marginTop: 10 }}>Here you can add some items to your shopping list!</Text>
            </View>
          )}
          </View>

          <ModalItemInfo 
            isVisible={isInfoModalVisible} selectedProduct={selectedProduct}
            onClose={() => setIsInfoModalVisible(false)}
          />

        </View>

        <ButtonBouncing style={[styles.Button_ShowReceipt, { borderWidth: isAnyChecked ? 2 : 0 }]} 
          innerStyle={{height: "100%", justifyContent: 'center', alignItems: 'center', }}
          isDisabled={!isAnyChecked}
          // onPress={handleDisplayCheckedItems}
          label={<MaterialCommunityIcons name="basket-check" 
            // color={isAnyChecked ? addButtonColor : 'black'}
             style={styles.basketButtonIcon}/>}
        />

        <Button_Autobasket 
          onAClick={() => navigation.navigate('AutoBasketPage')} 
          onGClick={handleAddAutoBasketToBasket} 
        />

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
    // backgroundColor: 'red',
    justifyContent: 'center',
    width: 65,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  deleteButton: {
    paddingRight: 20,
    width: 65,
    // backgroundColor: 'black',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: deleteButtonColor,
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
      backgroundColor: 'transparent',
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
