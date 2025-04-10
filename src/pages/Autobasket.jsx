// AutoBasketPage.js
import React, { useState, useRef, useCallback } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Pressable, TouchableWithoutFeedback, Keyboard, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';

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
import BasketItem from '../components/basket/BasketItem';
import BasketCustomItem from '../components/basket/BasketCustomItem';
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

  const combinedData = [
      ...autoBasket.filter(product => !product.isFromFridge),
      ...autoBasket.filter(product => product.isFromFridge),
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

  // return (
  //   <View style={styles.WholePage}>
  //     <ScrollView>
  //       <View style={styles.WholePage_ContentWrapper}>
  //         <SearchInput
  //           placeholder="Find a product"
  //           query={searchQuery}
  //           onChangeText={openSearchModal}
  //         />

  //         {editMode && (
  //           <View style={styles.controlButtons}>
  //             <Button title="Save" onPress={handleSaveDraft} />
  //             <Button title="Cancel" color="red" onPress={() => {
  //               setAutoBasketDraft([]);
  //               setEditMode(false); // Add this line
  //             }}
  //             />
  //           </View>
  //         )}

  //         <View style={styles.BasketPage_ListOfBasketItems}>
  //           {combinedItems.map((product) => (
  //             <BasketItem
  //               key={product.basketId}
  //               product={product}
  //               isChecked={false}
  //               onDecrement={() => handleDecrementProductAmount(product.basketId, product.amount)}
  //               onAdd={() => handleIncrementProductAmount(product.basketId, product.amount)}
  //               onToggleCheckbox={() => {}}
  //               openInfoModal={() => setSelectedProduct(product)}
  //               onChangeName={handleUpdateName}
  //             />
  //           ))}
  //         </View>

  //         <SearchModal
  //           isSearchModalVisible={isSearchModalVisible}
  //           closeSearchModal={closeSearchModal}
  //           addProduct={addProductToDraft}
  //           searchQuery={searchQuery}
  //           handleSearch={handleSearch}
  //           filteredData={filteredData}
  //           isRecipeCreate={true}
  //         />

  //         <ModalItemInfo
  //           isVisible={isInfoModalVisible}
  //           onClose={() => setIsInfoModalVisible(false)}
  //           selectedProduct={selectedProduct}
  //         />
  //       </View>
  //     </ScrollView>
  //   </View>
  // );


return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.BasketPage}>
        <View style={styles.BasketPage_ContentWrapper}>

          <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={openSearchModal} />
          
          <SearchModal 
            isSearchModalVisible={isSearchModalVisible}
            closeSearchModal={closeSearchModal}
            addProduct={addProductToDraft}
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            filteredData={filteredData}
            isRecipeCreate={true}
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
                onDecrement={() => handleDecrementProductAmount(item.basketId, item.amount)}
                onAdd={() => handleIncrementProductAmount(item.basketId, item.amount)}
                onToggleCheckbox={(isChecked) => handleToggleCheckbox(item.basketId, isChecked)}
                openInfoModal={() => handleItemPress(item)}
                onChangeName={handleUpdateName}
                swipeOpen={openRowKey === item.basketId}
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
