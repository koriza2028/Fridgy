import React, { useMemo } from "react";
import { View, TextInput, Pressable, StyleSheet, Dimensions, Platform } from "react-native";
import Tag from "../cooking/Tag";
import ModalProductCategoryPicker from "../fridge/ModalProductCategoryPicker";
import SearchModal from "../SearchModal";
import HeaderImage from "./HeaderImage"; // adjust the path as needed

import { tags } from "../../../assets/Variables/categories";
import { 
    buttonColor, deleteButtonColor, addButtonColor, backgroundColor, 
    MainFont, MainFont_Bold, MainFont_Title, ReceiptFont, TextFontSize, 
    SecondTitleFontSize, SecondTitleFontWeight, greyTextColor, blackTextColor 
  } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

const { width } = Dimensions.get("window");

const ListHeader = ({
  localImageUri,
  imageUri,
  scrollA,
  handleImageUpload,
  title,
  setTitle,
  categories,
  openCategoryModal,
  closeCategoryModal,
  handleMultipleCategoriesSelect,
  isCategoryModalVisible,
  searchQuery,
  handleSearchInput,
  filteredData,
  isSearchModalVisible,
  closeSearchModal,
  addIngredient,
  isMandatoryFlag,
  modalSearchRef
}) => {
    const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
        'Inter-Title': require('../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
      });

  // We separate the dependencies. Notice that for the HeaderImage we care only about image-related props.
  return useMemo(() => (
    <View style={styles.RecipeCreatePage_ContentWrapper}>
      <HeaderImage
        localImageUri={localImageUri}
        imageUri={imageUri}
        scrollA={scrollA}
        handleImageUpload={handleImageUpload}
      />
      <View style={styles.productDataEntry_Wrapper}>
        <View style={styles.productDataEntry}>
          <TextInput
            style={[styles.productDataEntryInput, styles.productName]}
            autoCapitalize="sentences"
            value={title}
            onChangeText={setTitle}
            placeholder="How is it called?"
            placeholderTextColor="#9e9e9e"
          />
        </View>
        <View style={styles.productDataEntry}>
          <Pressable
            style={[styles.productDataEntryInput, styles.productTags]}
            onPress={openCategoryModal}
          >
            {categories && categories.length > 0 ? (
              categories.map((category, index) => (
                <Tag key={index} name={category.tagName} type={category.tagType} icon={category.tagIcon} />
              ))
            ) : (
              <Tag name="Add tags +" />
            )}
          </Pressable>
        </View>
        <ModalProductCategoryPicker
          isCategoryModalVisible={isCategoryModalVisible}
          setIsCategoryModalVisible={setIsCategoryModalVisible}
          onClose={closeCategoryModal}
          onCategorySelect={handleMultipleCategoriesSelect}
          multiSelect={true}
          categories={tags}
          alreadySelectedCategories={categories || []}
        />
      </View>
      <SearchModal
        isSearchModalVisible={isSearchModalVisible}
        closeSearchModal={closeSearchModal}
        searchQuery={searchQuery}
        handleSearch={handleSearchInput}
        filteredData={filteredData}
        isRecipeCreate={true}
        addProduct={addIngredient}
        isMandatory={isMandatoryFlag}
        modalSearchRef={modalSearchRef}
      />
    </View>
  ), [
    // This dependency array should include only the props that affect the header.
    localImageUri,
    imageUri,
    scrollA,
    handleImageUpload,
    title,
    categories,
    isCategoryModalVisible,
    searchQuery,
    filteredData,
    isSearchModalVisible,
    isMandatoryFlag
  ]);
};

export default ListHeader;


const styles = StyleSheet.create({

  rowFront: {
    backgroundColor: 'white',
    // Ensure the front row has a fixed or minimum height matching your IngredientItem
    // For example, if your IngredientItem is about 70 pixels tall:
    minHeight: 70,
    justifyContent: 'center',
    // paddingHorizontal: '6%',
    width: '100%',
  },
  ingredientWrapper: {
    width: '90%',
    alignSelf: 'center',
  },
  rowBack: {
    position: 'absolute',
    top: 10,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: 'transparent', // prevent red box overflow
  },
  
  rowBackContent: {
    width: '90%', // match the rowFront visible width
    height: '100%',
    alignSelf: 'center', // center it horizontally
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  
  deleteButton: {
    width: 75,
    height: 50,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },

  

  RecipeCreatePage: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  RecipeCreatePage_ContentWrapper: {     
    alignItems: 'center',
    // marginBottom: 10,
  },
  ProductCreatePicture: scrollA => ({
    width: width,
    height: width,
    transform: [
      { translateY: scrollA},
    {
      scale: scrollA.interpolate({
        inputRange: [-width, 0, width],
        outputRange: [2, 1, 1], 
      }),
    }],
  }), 
  ProductPicture_Button: {
    zIndex: 3,
    height: 40,
    width: 40,
    borderRadius: 30,
    backgroundColor: '#fff',
    position: 'absolute',
    top: width - 140,
    left: width*0.84,
  },
  productDataEntry_Wrapper: {
    width: '90%',
    backgroundColor: '#fff',
    marginTop: -90,
    paddingTop: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productDataEntry: {        
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderColor: '#ddd',
  },
  productDataEntryInput: {
    marginVertical: 6,
    paddingHorizontal: 6,
  },
  productName: {
    fontSize: SecondTitleFontSize + 4,
    fontFamily: MainFont_Title,
    height: 40,
    color: blackTextColor,
    borderColor: '#ddd',
    // borderBottomWidth: 1,
  },
  productTags: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
    height: 50,
  },
  productCategory_Text: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
  },
  productNotes: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
    height: 150,
    paddingVertical: 10,
    lineHeight: Platform.OS === 'android' ? 24 : 20,
    borderColor: '#ddd',
    borderLeftWidth: 2,
  },
  ListOfIngredients: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  IngredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    width: '90%',
    marginHorizontal: 'auto',
  },
  addIngredient_Button: {
    marginRight: 14,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: addButtonColor,
    paddingVertical: 4,
    paddingHorizontal: 6,
    // shadowColor: addButtonColor, 
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.4,
    // shadowRadius: 1,
    // elevation: 1, 
  },
  addIngredient_ButtonText: {
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize,
    color: addButtonColor,
  },
  ListOfIngredients_Text: {
    fontWeight: SecondTitleFontWeight,
    fontSize: SecondTitleFontSize + 2,
  },
  SubListOfIngredients: {
    marginVertical: 6,
    marginBottom: 20,
  },
  buttonPanel: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 2,
  },
  Button_SaveRecipe: {
    backgroundColor: buttonColor,
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    height: width / 9,
    borderRadius: 60,
    shadowColor: buttonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,         
  },
  Button_UpdateProduct_Text: {
    fontFamily: MainFont_Title,
    fontSize: SecondTitleFontSize,
  },
  Button_SaveRecipeAlone: {
    width: '100%',
  },
  Button_DeleteRecipe: {
    borderRadius: 60,
    width: width / 9,
    height: width / 9,
    backgroundColor: deleteButtonColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: deleteButtonColor, 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  Button_SaveRecipeDisabled: {
    backgroundColor: '#A9A9A9',
    shadowColor: '#A9A9A9', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4, 
  },
});
