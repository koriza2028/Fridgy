import React, { useState, useEffect, useRef } from 'react';
import { TextInput, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

import { MainFont, SecondTitleFontSize } from '../../assets/Styles/styleVariables';

import ButtonGoBack from '../components/Button_GoBack';

const AutobasketPage = ({
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


  // Declare renderItem locally so that it’s defined based on the passed props.
  let renderItem = () => null;

  if (isBasket) {
    renderItem = ({ item, index }) => {
      // If the item is a string, then it represents a new item option.
      if (typeof item === 'string') {
        return (
          <TouchableOpacity style={styles.newItem} onPress={() => addProduct(item, false)}>
            <Text style={styles.searchItem_Text}>{item}</Text>
            <Text style={styles.ItemCategoryHint}>New item</Text>
          </TouchableOpacity>
        );
      }
      // Otherwise, it's an object from the fridge products.
      return (
        <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, true)}>
          <Text style={styles.searchItem_Text}>{item.name}</Text>
          <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
        </TouchableOpacity>
      );
    };
  } else if (isRecipeCreate) {
    renderItem = ({ item }) => (
      <TouchableOpacity style={styles.fridgeItem} onPress={() => addProduct(item, isMandatory)}>
        <Text style={styles.searchItem_Text}>{item.name}</Text>
        <Text style={styles.ItemCategoryHint}>{item.category? item.category.tagName : ""}</Text>
      </TouchableOpacity>
    );
  }

  // For basket modals, always add a new string item at the end (if search query is non-empty)
  const modifiedData =
    isBasket && !isRecipeCreate && searchQuery.trim() !== ''
      ? [...filteredData, searchQuery]
      : filteredData;

  return (
    <View>
        <ButtonGoBack navigation={navigation} />

      {/* REVIEW: USE THE DEFAULT SEARCH COMPONENT FOR THIS */}
      <TextInput
        style={styles.searchInput}
        placeholder="Find a product"
        value={searchQuery}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fridgeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

});

export default AutobasketPage;
