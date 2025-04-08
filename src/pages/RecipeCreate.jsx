import React, { useEffect, useState, useRef } from "react";
import { 
  StyleSheet, View, Text, TextInput, Image, Pressable, 
  Alert, Platform, Dimensions, ScrollView, RefreshControl, TouchableWithoutFeedback, Keyboard, SectionList
} from "react-native";
import { SwipeListView } from 'react-native-swipe-list-view';

import ButtonGoBack from '../components/ButtonGoBack';
import IngredientItem from "../components/cooking/IngredientCard";
import Tag from "../components/cooking/Tag";
import ModalProductCategoryPicker from "../components/fridge/ModalProductCategoryPicker";
import SearchModal from "../components/SearchModal";
import Entypo from 'react-native-vector-icons/Entypo';

import { 
  buttonColor, deleteButtonColor, addButtonColor, backgroundColor, 
  MainFont, MainFont_Bold, MainFont_Title, ReceiptFont, TextFontSize, 
  SecondTitleFontSize, SecondTitleFontWeight, greyTextColor, blackTextColor 
} from '../../assets/Styles/styleVariables';

import { tags } from "../../assets/Variables/categories";      
import { useFonts } from 'expo-font';

import { addOrUpdateRecipe, removeRecipe } from "../store/cookingStore";
import { fetchAllProducts } from "../store/fridgeStore";
import useAuthStore from "../store/authStore";

// NEW IMPORTS FOR IMAGE UPLOAD
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../firebaseConfig";

const { width, height } = Dimensions.get('window');

export default function RecipeCreatePage({ navigation, route }) {
  const userId = useAuthStore((state) => state.user?.uid);

  // Confirm deletion using platform-specific dialogs
  const confirmDelete = (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this recipe?')) {
        removeRecipe(userId, id)
          .then(() => navigation.navigate('CookingPage'))
          .catch(error => console.error("Error deleting recipe:", error));
      }
    } else {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this recipe?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: () =>
              removeRecipe(userId, id)
                .then(() => navigation.navigate('CookingPage'))
                .catch(error => console.error("Error deleting recipe:", error)),
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    'Inter-Title': require('../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
  });

  // Recipe data state
  const recipe = route.params?.recipe || null;
  const [title, setTitle] = useState(recipe?.title || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [id, setId] = useState(recipe?.id || '');
  const [categories, setCategories] = useState(recipe?.categories || []);
  // Here ingredients will be stored as references only.
  const [mandatoryIngredients, setMandatoryIngredients] = useState(recipe?.mandatoryIngredients || []);
  const [optionalIngredients, setOptionalIngredients] = useState(recipe?.optionalIngredients || []);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  
  // New state for uploaded image URL
  const [imageUri, setImageUri] = useState(recipe?.imageUri || null);

  useEffect(() => {
    if (recipe !== null && recipe.id) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setId(recipe.id);
      setCategories(recipe.categories);
      setMandatoryIngredients(recipe.mandatoryIngredients);
      setOptionalIngredients(recipe.optionalIngredients);
      setImageUri(recipe.imageUri || null);
      setIsCreatingNew(false);
    } else {
      setTitle(''); 
      setDescription('');
      setId('');
      setCategories([]);
      setMandatoryIngredients([]);
      setOptionalIngredients([]);
      setImageUri(null);
      setIsCreatingNew(true);
    }
  }, [recipe]);

  // For ingredient selection using fridge products (enriched with full data)
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(products);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);
  const [isMandatoryFlag, setIsMandatoryFlag] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const openCategoryModal = () => {
    setIsCategoryModalVisible(true);
  };
  const closeCategoryModal = () => {
    setIsCategoryModalVisible(false);
  };

  const handleMultipleCategoriesSelect = (selectedCategories) => {
    setCategories(selectedCategories);
  };

  // Fetch available products from the updated fridgeStore.
  useEffect(() => {
    if (userId) {
      fetchAllProducts(userId)
        .then(fetchedProducts => {
          const allProducts = fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
          setProducts(allProducts);
          setAvailableProducts(allProducts.filter(product => !product.isArchived));
          setFilteredData(allProducts);
        })
        .catch(error => {
          console.error('Failed to fetch fridge products:', error);
        });
    }
  }, [userId]);

  // NEW: handle image upload.
  const handleImageUpload = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storage = getStorage(app);
        const storageRef = ref(storage, `recipeImages/${new Date().getTime()}`);
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);
        setImageUri(downloadUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };

  const saveOrUpdateRecipe = () => {
    addOrUpdateRecipe(userId, { id: id ? id : null, title, categories, mandatoryIngredients, optionalIngredients, description, imageUri })
      .then(() => {
        navigation.navigate('CookingPage');
      })
      .catch(error => {
        console.error("Failed to save recipe:", error);
        setError("Failed to save recipe. Please try again.");
      });
  };

  const handleSearchInput = (text) => {
    setSearchQuery(text);
    let results = [];
    if (text) {
      results = products.filter((item) =>
        item.name.toLowerCase().includes(text.toLowerCase())
      );
    } else {
      results = products;
    }
    results.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredData(results);
  };

  // Adjusted addIngredient: now store only a reference to the product.
  const addIngredient = async (item, mandatoryFlag) => {        
    try {
      // Assume 'item' is already enriched (has name, imageUri, etc.)
      // Create a new ingredient reference that preserves the enriched fields.
      const ingredientToAdd = { 
        _id: Date.now().toString(), 
        productId: item.id, 
        amount: 1, 
        isFromFridge: item.isFromFridge || false,
        name: item.name,
        imageUri: item.imageUri,
        staticImagePath: item.staticImagePath,
      };
      if (mandatoryFlag) {
        setMandatoryIngredients(prev => [...prev, ingredientToAdd]);
      } else {
        setOptionalIngredients(prev => [...prev, ingredientToAdd]);
      }
      closeSearchModal();
      // Optionally, remove the added product from the search list:
      setProducts(prev => prev.filter(product => product.id !== item.id));
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      setError("Failed to add ingredient. Please try again.");
    }
  };
  

  // const removeIngredient = (productId, mandatoryFlag) => {
  //   try {
  //     if (mandatoryFlag) {
  //       setMandatoryIngredients(prev => prev.filter(ing => ing._id !== productId));
  //     } else {
  //       setOptionalIngredients(prev => prev.filter(ing => ing._id !== productId));
  //     }
  //   } catch (error) {
  //     console.error("Failed to remove ingredient:", error);
  //     setError("Failed to remove ingredient. Please try again.");
  //   }
  // };
  const removeIngredient = (idToRemove, mandatoryFlag) => {
    try {
      if (mandatoryFlag) {
        setMandatoryIngredients(prev =>
          prev.filter(ing => (ing._id || ing.productId) !== idToRemove)
        );
      } else {
        setOptionalIngredients(prev =>
          prev.filter(ing => (ing._id || ing.productId) !== idToRemove)
        );
      }
    } catch (error) {
      console.error("Failed to remove ingredient:", error);
      setError("Failed to remove ingredient. Please try again.");
    }
  };

  const checkIngredientIsAvailable = (originalFridgeId) => {
    return availableProducts.some(product => product.id === originalFridgeId);
  };

  // Rename duplicate openSearchModal to openIngredientSearchModal.
  const openIngredientSearchModal = (mandatoryFlag) => {
    setFilteredData(products);
    setIsMandatoryFlag(mandatoryFlag);
    setSearchModalVisible(true);
    setTimeout(() => {
      modalSearchRef.current?.focus();
    }, 100);
  };

  const closeSearchModal = () => {
    setSearchModalVisible(false);
    setSearchQuery('');
    setFilteredData([]);
  };

  const isSaveDisabled = title.trim() === '' || mandatoryIngredients.length === 0;

  const [isEditing, setIsEditing] = useState(false);

  const combinedData = [];

  // Mandatory Ingredients Header
  combinedData.push({
    type: 'header',
    title: 'Mandatory Ingredients',
    key: 'mandatory-header',
  });
  // Mandatory ingredient rows.
  mandatoryIngredients.forEach((ingredient) => {
    combinedData.push({
      type: 'ingredient',
      ingredient,
      mandatory: true,
      key: ingredient._id || ingredient.productId,
    });
  });

  // Optional Ingredients Header
  combinedData.push({
    type: 'header',
    title: 'Optional Ingredients',
    key: 'optional-header',
  });
  // Optional ingredient rows.
  optionalIngredients.forEach((ingredient) => {
    combinedData.push({
      type: 'ingredient',
      ingredient,
      mandatory: false,
      key: ingredient._id || ingredient.productId,
    });
  });

  // 2. Define renderItem to display headers and swipeable rows.
  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.IngredientsHeader}>
          <Text style={styles.ListOfIngredients_Text}>{item.title}</Text>
          <Pressable
            onPress={() =>
              item.title === 'Mandatory Ingredients'
                ? openIngredientSearchModal(true)
                : openIngredientSearchModal(false)
            }
            style={styles.addIngredient_Button}
          >
            <Text style={styles.addIngredient_ButtonText}>Add</Text>
          </Pressable>
        </View>
      );
    } else {
      return (
        // <View style={styles.ListOfIngredients}>
        // <View style={styles.SubListOfIngredients}></View>
        <View style={styles.rowFront}>
          <IngredientItem
            ingredient={item.ingredient}
            isMandatory={item.mandatory}
            onRemove={removeIngredient}
            isEditing={isEditing}
            isCreatingNew={isCreatingNew}
          />
        </View>
      );
    }
  };

  // 3. Define renderHiddenItem to show the "Delete" option only for ingredient rows.
  const renderHiddenItem = ({ item }) => {
    if (item.type === 'header') {
      // Headers do not have swipe actions.
      return <View style={{ height: 0 }} />;
    }
    return (
      <View style={styles.rowBack}>
        <Pressable
          style={styles.deleteButton}
          onPress={() =>
            removeIngredient(item.ingredient._id || item.ingredient.productId, item.mandatory)
          }
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    );
  };

  const ListHeader = () => (
      <View style={styles.RecipeCreatePage_ContentWrapper}>

        <View>
          <Image 
            style={styles.ProductCreatePicture} 
            source={imageUri ? { uri: imageUri } : require('../../assets/ProductImages/banana_test.png')}
          />
          <Pressable onPress={handleImageUpload} style={styles.ProductPicture_Button}></Pressable>
        </View>

        <View style={styles.productDataEntry_Wrapper}> 
          <View style={styles.productDataEntry}>
            <TextInput 
              style={[styles.productDataEntryInput, styles.productName]} 
              autoCapitalize="sentences" 
              value={title} 
              onChangeText={setTitle}
              placeholder='How is it called?' 
              placeholderTextColor={'#9e9e9e'}
            />
          </View>    
          <View style={styles.productDataEntry}>
            <TextInput 
              style={[styles.productDataEntryInput, styles.productNotes]} 
              autoCapitalize="sentences" 
              value={description} 
              onChangeText={setDescription}
              placeholder='Do you need instructions how to cook it?' 
              placeholderTextColor={'#9e9e9e'}
              multiline={true} 
              textAlignVertical="top"
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
                <Tag name={'Add tags +'} />
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
  )

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.RecipeCreatePage}>
        <SwipeListView
          data={combinedData}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={ListHeader}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          disableScrollOnSwipe
          nestedScrollEnabled
          // style={styles.ListOfIngredients}
          contentContainerStyle={{ paddingBottom: 100 }}
        />

        {/* Footer Buttons */}
        <View style={styles.buttonPanel}>
          {!isCreatingNew && (
            <Pressable
              style={styles.Button_DeleteRecipe}
              onPress={() => confirmDelete(id)}
            >
              <Text style={styles.Button_SaveRecipe_Text}>
                {/* Assuming Entypo is imported and configured */}
                <Entypo name="trash" size={28} />
              </Text>
            </Pressable>
          )}
          <Pressable
            style={[
              styles.Button_SaveRecipe,
              isSaveDisabled && styles.Button_SaveRecipeDisabled,
              isCreatingNew && styles.Button_SaveRecipeAlone,
            ]}
            onPress={saveOrUpdateRecipe}
            disabled={isSaveDisabled}
          >
            <Text style={styles.Button_UpdateProduct_Text}>Save</Text>
          </Pressable>
        </View>

        <ButtonGoBack navigation={navigation} />
      </View>
    </TouchableWithoutFeedback>
  );



  // kek ONSCROLL MUST MAGNIFY THE PICTURE

  // return (
  //   <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  //   <View style={styles.RecipeCreatePage}>
  //     <ScrollView >
  //       <View style={styles.RecipeCreatePage_ContentWrapper}>

  //         <View>
  //           <Image 
  //             style={styles.ProductCreatePicture} 
  //             source={imageUri ? { uri: imageUri } : require('../../assets/ProductImages/banana_test.png')}
  //           />
  //           <Pressable onPress={handleImageUpload} style={styles.ProductPicture_Button}></Pressable>
  //         </View>

  //         <View style={styles.productDataEntry_Wrapper}> 
  //           <View style={styles.productDataEntry}>
  //             <TextInput 
  //               style={[styles.productDataEntryInput, styles.productName]} 
  //               autoCapitalize="sentences" 
  //               value={title} 
  //               onChangeText={setTitle}
  //               placeholder='How is it called?' 
  //               placeholderTextColor={'#9e9e9e'}
  //             />
  //           </View>    
  //           <View style={styles.productDataEntry}>
  //             <TextInput 
  //               style={[styles.productDataEntryInput, styles.productNotes]} 
  //               autoCapitalize="sentences" 
  //               value={description} 
  //               onChangeText={setDescription}
  //               placeholder='Do you need instructions how to cook it?' 
  //               placeholderTextColor={'#9e9e9e'}
  //               multiline={true} 
  //               textAlignVertical="top"
  //             />
  //           </View>
  //           <View style={styles.productDataEntry}>
  //             <Pressable 
  //               style={[styles.productDataEntryInput, styles.productTags]} 
  //               onPress={openCategoryModal}
  //             >
  //               {categories && categories.length > 0 ? (
  //                 categories.map((category, index) => (
  //                   <Tag key={index} name={category.tagName} type={category.tagType} icon={category.tagIcon} />
  //                 ))
  //               ) : (
  //                 <Tag name={'Add tags +'} />
  //               )}
  //             </Pressable>
  //           </View>
  //           <ModalProductCategoryPicker 
  //             isCategoryModalVisible={isCategoryModalVisible} 
  //             setIsCategoryModalVisible={setIsCategoryModalVisible} 
  //             onClose={closeCategoryModal}
  //             onCategorySelect={handleMultipleCategoriesSelect} 
  //             multiSelect={true}
  //             categories={tags} 
  //             alreadySelectedCategories={categories || []}
  //           />
  //         </View>   

  //         <View style={styles.ListOfIngredients}>
  //           <View style={styles.SubListOfIngredients}>

  //             <View style={styles.IngredientsHeader}>
  //               <Text style={styles.ListOfIngredients_Text}>Mandatory Ingredients</Text>
  //               {/* {isCreatingNew && ( */}
  //                 <Pressable onPress={() => openIngredientSearchModal(true)} style={styles.addIngredient_Button}>
  //                   <Text style={styles.addIngredient_ButtonText}>Add</Text>
  //                 </Pressable>
  //               {/* )} */}
  //             </View>
  //           </View>

  //           {mandatoryIngredients && mandatoryIngredients.length > 0 ? (
  //             <SwipeListView
  //               data={mandatoryIngredients}
  //               keyExtractor={(item) => item._id || item.productId}
  //               renderItem={({ item }) => (
  //                 <View style={styles.rowFront}>
  //                   <IngredientItem 
  //                     ingredient={item}
  //                     isAvailable={checkIngredientIsAvailable(item.productId)}
  //                     isMandatory={true}
  //                     onRemove={removeIngredient}
  //                     isEditing={isEditing}
  //                     isCreatingNew={isCreatingNew}
  //                   />
  //                 </View>
  //               )}
  //               renderHiddenItem={({ item }) => (
  //                 <View style={styles.rowBack}>
  //                   <Pressable 
  //                     style={styles.deleteButton}
  //                     onPress={() => removeIngredient(item._id || item.productId, true)}
  //                   >
  //                     <Text style={styles.deleteText}>Delete</Text>
  //                   </Pressable>
  //                 </View>
  //               )}
  //               rightOpenValue={-75}
  //               disableRightSwipe
  //               disableScrollOnSwipe
  //               nestedScrollEnabled={true}
  //               scrollEnabled={false}
  //               contentContainerStyle={{ paddingBottom: 10 }}
  //             />
  //           ) : (
  //             <Text style={{ fontFamily: MainFont, fontSize: 14, marginBottom: 6 }}>
  //               Select at least one ingredient
  //             </Text>
  //           )}

  //           <View style={styles.SubListOfIngredients}>
  //             <View style={styles.IngredientsHeader}>
  //               <Text style={styles.ListOfIngredients_Text}>Optional Ingredients</Text>
  //               {/* {isCreatingNew && ( */}
  //                 <Pressable onPress={() => openIngredientSearchModal(false)} style={styles.addIngredient_Button}>
  //                   <Text style={styles.addIngredient_ButtonText}>Add</Text>
  //                 </Pressable>
  //               {/* )} */}
  //             </View>
  //           </View>
          

  //           {optionalIngredients && optionalIngredients.length > 0 ? (
  //             <SwipeListView
  //               data={optionalIngredients}
  //               keyExtractor={(item) => item._id || item.productId}
  //               renderItem={({ item }) => (
  //                 <View style={styles.rowFront}>
  //                   <IngredientItem 
  //                     ingredient={item}
  //                     isMandatory={false}
  //                     onRemove={removeIngredient}
  //                     isEditing={isEditing}
  //                     isCreatingNew={isCreatingNew}
  //                   />
  //                 </View>
  //               )}
  //               renderHiddenItem={({ item }) => (
  //                 <View style={styles.rowBack}>
  //                   <Pressable 
  //                     style={styles.deleteButton}
  //                     onPress={() => removeIngredient(item._id || item.productId, false)}
  //                   >
  //                     <Text style={styles.deleteText}>Delete</Text>
  //                   </Pressable>
  //                 </View>
  //               )}
  //               rightOpenValue={-75}
  //               disableRightSwipe
  //               disableScrollOnSwipe
  //               nestedScrollEnabled={true}
  //               scrollEnabled={false}
  //               contentContainerStyle={{ paddingBottom: 10 }}
  //             />
  //           ) : (
  //             <View />
  //           )}
  //         </View>

  //         <SearchModal 
  //           isSearchModalVisible={isSearchModalVisible} 
  //           closeSearchModal={closeSearchModal} 
  //           searchQuery={searchQuery} 
  //           handleSearch={handleSearchInput} 
  //           filteredData={filteredData}
  //           isRecipeCreate={true} 
  //           addProduct={addIngredient} 
  //           isMandatory={isMandatoryFlag}
  //           modalSearchRef={modalSearchRef}
  //         />
  //       </View>
  //     </ScrollView>

  //     <View style={styles.buttonPanel}>
  //       {!isCreatingNew && (
  //         <Pressable style={[styles.Button_DeleteRecipe]} onPress={() => confirmDelete(id)}>
  //           <Text style={styles.Button_SaveRecipe_Text}> <Entypo name="trash" size={28} /> </Text>
  //         </Pressable>
  //       )}
  //       <Pressable 
  //         style={[
  //           styles.Button_SaveRecipe, 
  //           isSaveDisabled && styles.Button_SaveRecipeDisabled, 
  //           isCreatingNew && styles.Button_SaveRecipeAlone
  //         ]}
  //         onPress={saveOrUpdateRecipe} disabled={isSaveDisabled} >
  //         <Text style={styles.Button_UpdateProduct_Text}>Save</Text>
  //       </Pressable>
  //     </View>

  //     <ButtonGoBack navigation={navigation} />
  //   </View>
  //   </TouchableWithoutFeedback>
  // );
}

const styles = StyleSheet.create({

  rowFront: {
    backgroundColor: 'white',
    // Ensure the front row has a fixed or minimum height matching your IngredientItem
    // For example, if your IngredientItem is about 70 pixels tall:
    minHeight: 70,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rowBack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 75,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
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
  ProductCreatePicture: {
    width: width,
    height: width,
  }, 
  ProductPicture_Button: {
    zIndex: 3,
    height: 40,
    width: 40,
    borderRadius: 30,
    backgroundColor: '#fff',
    position: 'absolute',
    top: width - 140,
    left: width - 50,
  },
  productDataEntry_Wrapper: {
    width: '100%',
    backgroundColor: '#fff',
    marginTop: -90,
    paddingTop: 10,
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
    marginTop: 14,
    paddingHorizontal: 10,
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
