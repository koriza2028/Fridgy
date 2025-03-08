import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
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
          <TouchableOpacity style={styles.newItem} onPress={() => addProduct(item, index)}>
            <Text style={styles.searchItem_Text}>{item}</Text>
            <Text style={styles.ItemCategoryHint}>New item</Text>
          </TouchableOpacity>
        );
      }
      // Otherwise, it's an object from the fridge products.
      return (
        <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, index)}>
          <Text style={styles.searchItem_Text}>{item.name}</Text>
          <Text style={styles.ItemCategoryHint}>{item.category.tagName}</Text>
        </TouchableOpacity>
      );
    };
  } else if (isRecipeCreate) {
    renderItem = ({ item }) => (
      <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, isMandatory)}>
        <Text style={styles.searchItem_Text}>{item.name}</Text>
        <Text style={styles.ItemCategoryHint}>{item.category.tagName}</Text>
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
      <TouchableOpacity onPress={closeSearchModal}>
        <Text>X</Text>
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
    borderColor: '#C0C0C0',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  flatList: {
    marginTop: 8,
  },
  fridgeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newItem: {
    padding: 10,
    backgroundColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchItem_Text: {
    fontSize: SecondTitleFontSize,
    fontFamily: MainFont,
  },
  ItemCategoryHint: {
    padding: 10,
    fontSize: 12,
    fontFamily: MainFont,
  },
});

export default SearchModal;
