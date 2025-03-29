import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Entypo from 'react-native-vector-icons/Entypo';

import { useFonts } from 'expo-font';
import { MainFont, SecondTitleFontSize } from '../../assets/Styles/styleVariables';

const SearchModal = ({
  isSearchModalVisible,
  closeSearchModal,
  searchQuery,
  handleSearch,
  filteredData,
  addProduct,
  isMandatory,
  isRecipeCreate,
  isBasket,
}) => {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });


  const modalSearchRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isSearchModalVisible && modalSearchRef.current) {
      // A small delay ensures the modal is fully rendered before focusing the input.
      setTimeout(() => {
        modalSearchRef.current.focus();
      }, 100);
    }
  }, [isSearchModalVisible]);

  // Declare renderItem locally so that it’s defined based on the passed props.
  let renderItem = () => null;

  if (isBasket) {
    renderItem = ({ item, index }) => {
      // If the item is a string, then it represents a new item option.
      if (typeof item === 'string') {
        return (
          <TouchableOpacity style={styles.newItem} onPress={() => addProduct(item, false)}>
            <Text style={styles.searchItem_Text}>{item}</Text>
            <Text style={styles.ItemCategoryHint}>Add new item</Text>
          </TouchableOpacity>
        );
      }
      // Otherwise, it's an object from the fridge products.
      return (
        <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, true)}>
          <Image
            source={item.imageUri 
              ? { uri: item.imageUri } 
              : require('../../assets/ProductImages/banana_test.png')}
            style={styles.searchItem_Image}
          />
          <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.name}</Text>
            <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
          </View>
        </TouchableOpacity>
      );
    };
  } else if (isRecipeCreate) {
    renderItem = ({ item }) => (
      <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, isMandatory)}>
        <Image
            source={item.imageUri 
              ? { uri: item.imageUri } 
              : require('../../assets/ProductImages/banana_test.png')}
            style={styles.searchItem_Image}
          />
        <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.name}</Text>
            <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
          </View>
      </TouchableOpacity>
    );
  }

  // For basket modals, always add a new string item at the end (if search query is non-empty)
  const modifiedData =
    isBasket && !isRecipeCreate && searchQuery.trim() !== ''
      ? [...filteredData, searchQuery]
      : filteredData;

  return (
    <Modal
      isVisible={isSearchModalVisible}
      onBackdropPress={closeSearchModal}
      onBackButtonPress={closeSearchModal}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={1}
      animationOutTiming={1}
      style={styles.modal}
    >
      <TouchableOpacity onPress={closeSearchModal} style={styles.closeButton}>
        <Entypo name="chevron-left" size={20} />
      </TouchableOpacity>

      {/* REVIEW: USE THE DEFAULT SEARCH COMPONENT FOR THIS */}
      <TextInput
        style={styles.searchInput}
        placeholder="Find a product"
        value={searchQuery}
        onChangeText={handleSearch}
        ref={modalSearchRef}
      />

      {isBasket && !isRecipeCreate && (
        <View style={styles.modalContent}>
          {searchQuery.trim() !== '' && (
            <FlatList
              data={modifiedData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              style={styles.flatList}
            />
          )}
        </View>
      )}

      {!isBasket && isRecipeCreate && (
        <View style={styles.modalContent}>
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            style={styles.flatList}
          />
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0, // Full-screen modal
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    paddingTop: 20,
  },
  modalContent: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    height: 40,
    alignSelf: 'center',
    padding: 8,
    paddingHorizontal: 36,
    marginBottom: 10,
    marginTop: 10,
    fontFamily: MainFont,

    shadowColor: "darkgrey", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2, 
    // marginTop: 20,
    // marginBottom: 10,
  },
  flatList: {
    marginTop: 8,
  },
  fridgeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
  },
  newItem: {
    padding: 10,
    backgroundColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchItem_Image: {
    width: 50,
    height: 50,
    // borderRadius: 25,
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

  closeButton: {
    position: 'absolute',
    top: 34,
    left: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    zIndex: 1,
  },
});

export default SearchModal;
