import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View, Text, Pressable, FlatList, Keyboard, Dimensions } from 'react-native';

import Modal from 'react-native-modal';
import Entypo from 'react-native-vector-icons/Entypo';

const { width, height } = Dimensions.get("window");

// import SearchInput from './Search';

import { useFonts } from 'expo-font';
import { backgroundColor, MainFont, SecondTitleFontSize } from '../../assets/Styles/styleVariables';

import AppImage from './image/AppImage';
import ButtonBouncing from './Button_Bouncing';

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

  const renderItem = ({ item }) => (
    <ButtonBouncing 
      onPress={() => {
        addProduct(item, isMandatory)
      }
        }
      style={{borderRadius: 6}}  
      toScale={0.95} label={
      <View style={styles.fridgeItem}>
        <AppImage 
          style={styles.searchItem_Image}
          imageUri={item.imageUri}
          staticImagePath={item.staticImagePath}
        />
        <View style={styles.NameAndHint}>
            <Text style={styles.searchItem_Text}>{item.name}</Text>
            <Text style={styles.ItemCategoryHint}>{item.category ? item.category.tagName : ""}</Text>
        </View>
      </View>}
    />
  );


  // For basket modals, always add a new string item at the end (if search query is non-empty)

  return (
    <Modal
      isVisible={isSearchModalVisible}
      // onBackdropPress={Keyboard.dismiss}
      // avoidKeyboard={true}
      onBackButtonPress={closeSearchModal}
      animationIn='fadeIn'
      animationOut="fadeOut"
      // animationInTiming={300}
      // animationOutTiming={0}
      style={styles.modal}
    >
      <Pressable onPress={() => {  Keyboard.dismiss(); closeSearchModal()}} 
        style={styles.closeButton}>
        <Entypo name="chevron-left" size={30} />
      </Pressable>

      {/* REVIEW: USE THE DEFAULT SEARCH COMPONENT FOR THIS */}
      <TextInput
        style={styles.searchInput}
        placeholder="Find a product"
        value={searchQuery}
        onChangeText={handleSearch}
        // ref={modalSearchRef}
        // нахер его, от него лишь проблемы с двойными кликами 
      />
      
      <View style={styles.modalContent}>
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          onScrollBeginDrag={Keyboard.dismiss}
          keyboardShouldPersistTaps="always"
          style={styles.flatList}
        />
      </View>

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
    height: height,
    // borderWidth: 1,
    // borderColor: '#C0C0C0',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: '#C0C0C0',
    width: '96%',
    height: 42,
    alignSelf: 'center',
    paddingBottom: 4,
    paddingHorizontal: 44,
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
    // marginTop: 8,
  },
  fridgeItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
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
