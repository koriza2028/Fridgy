import React, { useEffect, useState, useRef } from "react";
import { 
  StyleSheet, View, Text, TextInput, Image, TouchableOpacity, 
  Alert, Platform, Dimensions, ScrollView 
} from "react-native";
import ButtonGoBack from '../components/Button_GoBack';
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
import { fetchAllFridgeProducts } from "../store/fridgeStore";
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
        removeRecipe(id)
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
            onPress: () => console.log('Deletion cancelled'),
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: () =>
              removeRecipe(id)
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
  const [id, setId] = useState(recipe?.id || ''); // using 'id' instead of '_id'
  const [categories, setCategories] = useState(recipe?.categories || []);
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

  // For product search and ingredient selection (using fridge products)
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState(products);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);
  const [isMandatory, setIsMandatory] = useState(null);
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

  // Fetch available products from the fridge when component is focused.
  useEffect(() => {
    if (userId) {
      fetchAllFridgeProducts(userId)
        .then(fetchedProducts => {
          const availableProducts = fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
          setProducts(availableProducts);
          setFilteredData(availableProducts);
        })
        .catch(error => {
          console.error('Failed to fetch fridge products:', error);
        });
    }
  }, [userId]);

  // NEW FUNCTION: handle image upload.
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
        // Use a unique reference path based on current timestamp.
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

  const SaveOrUpdateRecipe = () => {
    // Include imageUri in the recipe data.
    addOrUpdateRecipe(userId, { id: id ? id : null, title, categories, mandatoryIngredients, optionalIngredients, description, imageUri })
      .then(() => {
        setIsEditing(!isEditing)
        if (isCreatingNew) {
          setTitle('');
          setDescription('');
          setId('');
          navigation.navigate('CookingPage');
        }
      })
      .catch(error => {
        console.error("Failed to save recipe:", error);
        setError("Failed to save recipe. Please try again.");
      });
  };

  const handleSearch = (text) => {
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

  const addIngredient = async (item, isMandatoryFlag) => {        
    try {
      const ingredientToAdd = { ...item, _id: item.id };
      if (isMandatoryFlag) {
        setMandatoryIngredients(prev => [...prev, ingredientToAdd]);
      } else {
        setOptionalIngredients(prev => [...prev, ingredientToAdd]);
      }
      closeSearchModal();
      setProducts(prev => prev.filter(product => product.id !== item.id));
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      setError("Failed to add ingredient. Please try again.");
    }
  };

  const removeProduct = (productId, isMandatory) => {
    try {
      if (isMandatory) {
        setMandatoryIngredients(prevIngredients => {
          const updatedIngredients = prevIngredients.filter(ingredient => ingredient._id !== productId);
          return updatedIngredients;
        });
      } else {
        setOptionalIngredients(prevIngredients => {
          const updatedIngredients = prevIngredients.filter(ingredient => ingredient._id !== productId);
          return updatedIngredients;
        });
      }
      
    } catch (error) {
      console.error("Failed to remove ingredient:", error);
      setError("Failed to remove ingredient. Please try again.");
    }
  };

  const openSearchModal = (mandatoryFlag) => {
    setFilteredData(products);
    setIsMandatory(mandatoryFlag);
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

  return (
    <View style={styles.RecipeCreatePage}>
      <ScrollView style={{ height: '100vh' }}>
        <View style={styles.RecipeCreatePage_ContentWrapper}>

          <View>
            <Image 
              style={styles.ProductCreatePicture} 
              source={imageUri ? { uri: imageUri } : require('../../assets/ProductImages/banana_test.png')}
            />
            <TouchableOpacity onPress={handleImageUpload} style={styles.ProductPicture_Button}></TouchableOpacity>
          </View>

          <View style={styles.productDataEntry_Wrapper}> 

            <View style={styles.productDataEntry}>
              <TextInput 
                style={[styles.productDataEntryInput, styles.productName]} 
                autoCapitalize="sentences" 
                value={title} 
                onChangeText={text => setTitle(text)}
                placeholder='How is it called?' 
                placeholderTextColor={'#9e9e9e'}
              />
            </View>    


            <View style={styles.productDataEntry}>
              <TextInput 
                style={[styles.productDataEntryInput, styles.productNotes]} 
                autoCapitalize="sentences" 
                value={description} 
                onChangeText={text => setDescription(text)}
                placeholder='Do you need instructions how to cook it?' 
                placeholderTextColor={'#9e9e9e'}
                multiline={true} 
                textAlignVertical="top"
              />
            </View>

            <View style={styles.productDataEntry}>
              <TouchableOpacity 
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
              </TouchableOpacity>
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

          <View style={styles.ListOfIngredients}>

            <View style={styles.SubListOfIngredients}>
              <View style={styles.IngredientsHeader}>
                <Text style={styles.ListOfIngredients_Text}>Mandatory Ingredients</Text>

                {(isCreatingNew || isEditing) && (
                <TouchableOpacity onPress={() => openSearchModal(true)} style={styles.addIngredient_Button}>
                  <Text style={styles.addIngredient_ButtonText}>Add</Text>
                </TouchableOpacity>
                )}

              </View>
            </View>

            {mandatoryIngredients && mandatoryIngredients.length > 0 ? (
              mandatoryIngredients.map((ingredient, index) => (
                <IngredientItem key={index} ingredient={ingredient} isMandatory={true} onRemove={removeProduct} isEditing={isEditing} isCreatingNew={isCreatingNew}/>
              ))
            ) : (
              <View>
                <Text style={{fontFamily: MainFont, fontSize: 14, marginBottom: 6}}>
                  Select at least one ingredient
                </Text>
              </View>
            )}

            <View style={styles.SubListOfIngredients}>
              <View style={styles.IngredientsHeader}>
                <Text style={styles.ListOfIngredients_Text}>Optional Ingredients</Text>

                {(isCreatingNew || isEditing) && (
                  <TouchableOpacity onPress={() => openSearchModal(false)} style={styles.addIngredient_Button}>
                    <Text style={styles.addIngredient_ButtonText}>Add</Text>
                </TouchableOpacity>)}
                
              </View>
            </View>

            {optionalIngredients && optionalIngredients.length > 0 ? (
              optionalIngredients.map((ingredient, index) => (
                <IngredientItem key={index} ingredient={ingredient} isMandatory={false} onRemove={removeProduct} isEditing={isEditing} isCreatingNew={isCreatingNew}/>
              ))
            ) : (<View></View>)}

          </View>

          <SearchModal 
            isSearchModalVisible={isSearchModalVisible} 
            closeSearchModal={closeSearchModal} 
            searchQuery={searchQuery} 
            handleSearch={handleSearch} 
            filteredData={filteredData}
            isRecipeCreate={true} 
            addProduct={addIngredient} 
            isMandatory={isMandatory}
            modalSearchRef={modalSearchRef}
          />
        </View>

      </ScrollView>

      
    
      <View style={styles.buttonPanel}>

        {!isCreatingNew && isEditing && (
          <TouchableOpacity style={[styles.Button_DeleteRecipe]} onPress={() => confirmDelete(id)}>
            <Text style={styles.Button_SaveRecipe_Text}> <Entypo name="trash" size={28} /> </Text>
          </TouchableOpacity>
        )}

        {(isCreatingNew || isEditing) && (
        <TouchableOpacity 
          style={[
            styles.Button_SaveRecipe, 
            isSaveDisabled && styles.Button_SaveRecipeDisabled, 
            isCreatingNew && styles.Button_SaveRecipeAlone
          ]}
          onPress={SaveOrUpdateRecipe} disabled={isSaveDisabled} >
          <Text style={styles.Button_UpdateProduct_Text}>Save</Text>
        </TouchableOpacity>
        )}

        {!isEditing && !isCreatingNew && (<TouchableOpacity style={styles.Button_Editing} onPress={() => setIsEditing(!isEditing)}></TouchableOpacity>)}

      </View>

      <ButtonGoBack navigation={navigation} />

    </View>
  );
}

const styles = StyleSheet.create({
  RecipeCreatePage: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  RecipeCreatePage_ContentWrapper: {     
    alignItems: 'center',
    marginBottom: 90,
  },
  Text_ProductDataLabel: {
    marginBottom: 20,
    marginTop: 62,
    fontSize: SecondTitleFontSize,
    fontFamily: ReceiptFont,
    fontWeight: "700",
    textAlign: 'center',
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
    borderBottomWidth: 1,
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
    height: 160,
    paddingVertical: 10,
    lineHeight: Platform.OS === 'android' ? 24 : '140%',
  },
  ListOfIngredients: {
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  IngredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addIngredient_Button: {
    marginRight: 14,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: addButtonColor,
    paddingVertical: 4,
    paddingHorizontal: 6,
    shadowColor: addButtonColor, 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 1, 
  },
  addIngredient_ButtonText: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
    color: addButtonColor,
  },
  ListOfIngredients_Text: {
    fontWeight: SecondTitleFontWeight,
    fontSize: SecondTitleFontSize + 2,
  },
  SubListOfIngredients: {
    marginVertical: 6,
  },
  ButtonsContainer: {
    width: '100%',
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

  Button_Editing: {
    position: 'relative',
    left: '40%',
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
    borderWidth: 2,
    
    shadowColor: '#007bff', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,        
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: blackTextColor,
    fontWeight: 'bold',
  },
});
