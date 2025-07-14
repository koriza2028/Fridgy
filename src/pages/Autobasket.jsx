// Refactored AutoBasketPage to align with BasketPage styling and structure

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  LayoutAnimation,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';

import useAuthStore from '../store/authStore';
import {
  fetchAutoBasketProducts,
  addProductToAutoBasket,
  updateProductAmountInAutoBasket,
  removeProductFromAutoBasket
} from '../store/autoBasketStore';
import { fetchAllProducts } from '../store/fridgeStore';

import SearchInput from '../components/Search';
import BasketItem from '../components/basket/BasketItem';
import ModalItemInfo from '../components/basket/ModalItemInfo';
import ButtonBouncing from '../components/Button_Bouncing';
import AppImage from '../components/image/AppImage';

import Entypo from 'react-native-vector-icons/Entypo';
import { backgroundColor, deleteButtonColor, SecondTitleFontSize, MainFont } from '../../assets/Styles/styleVariables';

const { width, height } = Dimensions.get('window');

export default function AutoBasketPage() {
  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });

  const [autoBasket, setAutoBasket] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [openRowKey, setOpenRowKey] = useState(null);

  useFocusEffect(
    useCallback(() => {
      refreshAutoBasket();
    }, [ctx.userId, ctx.familyId])
  );

  const refreshAutoBasket = async () => {
    try {
      const [autoItems, allProducts] = await Promise.all([
        fetchAutoBasketProducts(ctx),
        fetchAllProducts(ctx),
      ]);
      setAutoBasket(autoItems);
      setProducts(allProducts);
    } catch (err) {
      console.error("Failed to fetch auto basket:", err);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const results = products.filter(
        (p) => !autoBasket.some((a) => a.productId === p.id) &&
               p.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    } else {
      setFilteredData([]);
    }
  };

  const addProduct = async (item) => {
    try {
      await addProductToAutoBasket(ctx, item);
      setSearchQuery('');
      setFilteredData([]);
      Keyboard.dismiss();
      await refreshAutoBasket();
    } catch (err) {
      console.error("Failed to add product:", err);
    }
  };

  const handleIncrementProductAmount = async (id, currentAmount) => {
    await updateProductAmountInAutoBasket(ctx, id, currentAmount + 1);
    await refreshAutoBasket();
  };

  const handleRemoveAutoBasketProduct = async (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const prev = autoBasket;
    setAutoBasket(prev.filter(item => item.autoBasketId !== id));
    try {
      await removeProductFromAutoBasket(ctx, id);
    } catch (err) {
      console.error(err);
      setAutoBasket(prev);
    }
  };

  const handleItemPress = (product) => {
    setSelectedProduct(product);
    setIsInfoModalVisible(true);
  };

  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <Pressable style={styles.deleteButton} onPress={() => handleRemoveAutoBasketProduct(item.autoBasketId)}>
        <Entypo name="trash" size={28} style={styles.deleteButtonText} />
      </Pressable>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.BasketPage}>
        <View style={styles.BasketPage_ContentWrapper}>

          <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={handleSearch} />

          <View style={styles.BasketPage_ListOfBasketItems}>
            {searchQuery.length > 0 ? (
              <FlatList
                data={filteredData}
                keyExtractor={(item, index) => index.toString()}
                keyboardShouldPersistTaps="always"
                renderItem={({ item }) => (
                  <ButtonBouncing
                    style={{ borderRadius: 6 }}
                    onPress={() => addProduct(item)}
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
                    }
                    toScale={0.95}
                  />
                )}
              />
            ) : (
              <SwipeListView
                data={autoBasket}
                keyExtractor={(item) => item.autoBasketId.toString()}
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
                      onDecrement={() => handleRemoveAutoBasketProduct(item.autoBasketId)}
                      onAdd={() => handleIncrementProductAmount(item.autoBasketId, item.amount)}
                      openInfoModal={() => handleItemPress(item)}
                      swipeOpen={openRowKey === item.autoBasketId}
                      autobasket={true}
                    />
                  </View>
                )}
              />
            )}
          </View>

          <ModalItemInfo
            isVisible={isInfoModalVisible}
            selectedProduct={selectedProduct}
            onClose={() => setIsInfoModalVisible(false)}
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
    alignItems: 'flex-end',
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
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: deleteButtonColor, // imported from styleVariables
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
  fridgeItem: {
    flexDirection: 'row',
  },
  searchItem: {
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
