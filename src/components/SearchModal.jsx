import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View, Text, Pressable, FlatList, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Image } from 'expo-image';

import Modal from 'react-native-modal';
import Entypo from 'react-native-vector-icons/Entypo';

// import SearchInput from './Search';
import Tag from './cooking/Tag';

import { useFonts } from 'expo-font';
import { backgroundColor, MainFont, SecondTitleFontSize } from '../../assets/Styles/styleVariables';

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
  isMealPlanner
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

  const getImageSource = (item) => {
    if (item.imageUri) {
        return { uri: item.imageUri };
    }
    // if (item.staticImagePath) {
    //     return item.staticImagePath;
    // }
    return require('../../assets/ProductImages/banana_test.png');
  };

  if (isBasket) {
    renderItem = ({ item, index }) => {
      // If the item is a string, then it represents a new item option.
      if (typeof item === 'string') {
        return (
          <Pressable style={styles.newItem} onPress={() => addProduct(item, false)}>
            <Text style={styles.searchItem_Text}>{item}</Text>
            <Text style={styles.ItemCategoryHint}>Add new item</Text>
          </Pressable>
        );
      }
      // Otherwise, it's an object from the fridge products.
      return (
        <Pressable style={styles.fridgeItem} onPress={() => addProduct(item, true)}>
          <Image
            source={getImageSource(item)}
            style={styles.searchItem_Image}
          />
          <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.name}</Text>
            <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
          </View>
        </Pressable>
      );
    };
  } else if (isRecipeCreate) {
    renderItem = ({ item }) => (
      <Pressable style={styles.fridgeItem} onPress={() => addProduct(item, isMandatory)}>
        <Image
          source={getImageSource(item)}
          style={styles.searchItem_Image}
        />
        <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.name}</Text>
            <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
          </View>
      </Pressable>
    );
  } else if (isMealPlanner) {
    renderItem = ({ item }) => (
      <Pressable style={styles.mealItem} onPress={() => addProduct(item, isMandatory)}>
        <Image
          source={getImageSource(item)}
          style={styles.searchItem_Image}
        />
        <View style={styles.NameAndHint}>
          <Text style={styles.searchItem_Text}>{item.title}</Text>
          <Tag style={styles.ItemCategoryTag}>{item.category ? item.category.tagName : "a"}</Tag>
        </View>
      </Pressable>
    );
  } else {
    renderItem = ({ item }) => (
      <Pressable style={styles.fridgeItem} onPress={() => addProduct(item.id)}>
        <Image
          source={getImageSource(item)}
          style={styles.searchItem_Image}
        />
        <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.title}</Text>
        </View>
      </Pressable>
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
      // onBackdropPress={Keyboard.dismiss}
      // avoidKeyboard={true}
      onBackButtonPress={closeSearchModal}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={1}
      animationOutTiming={300}
      style={styles.modal}
    >
      <Pressable onPress={closeSearchModal} style={styles.closeButton}>
        <Entypo name="chevron-left" size={28} />
      </Pressable>

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
              keyboardShouldPersistTaps="handled"
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
            keyboardShouldPersistTaps="handled"
            style={styles.flatList}
          />
        </View>
      )}

      {!isBasket && !isRecipeCreate && (
        <View style={styles.modalContent}>
          <FlatList
            data={filteredData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
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
    backgroundColor: backgroundColor,
    paddingTop: 40,
  },
  modalContent: {
    padding: 10,
    // width: '100%',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: '#C0C0C0',
    width: '96%',
    height: 40,
    alignSelf: 'center',
    paddingBottom: 4,
    paddingHorizontal: 40,
    marginBottom: 10,
    marginTop: 20,
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

  closeButton: {
    position: 'absolute',
    top: 60,
    left: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 5,
    zIndex: 1,
  },
});

export default SearchModal;
