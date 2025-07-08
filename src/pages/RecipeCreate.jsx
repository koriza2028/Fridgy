import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  Animated,
  Easing
} from "react-native";
// import { InteractionManager } from 'react-native';
import ImageWithUpload from "../components/ImageWithUpload";

import ButtonGoBack from "../components/ButtonGoBack";
import IngredientItem from "../components/cooking/IngredientCard";
import Tag from "../components/cooking/Tag";
import ModalProductCategoryPicker from "../components/fridge/ModalProductCategoryPicker";
import SearchModal from "../components/SearchModal";
import ButtonBouncing from "../components/Button_Bouncing";

import Entypo from "react-native-vector-icons/Entypo";

import {
  buttonColor,
  deleteButtonColor,
  addButtonColor,
  backgroundColor,
  MainFont,
  MainFont_Bold,
  MainFont_Title,
  ReceiptFont,
  TextFontSize,
  SecondTitleFontSize,
  SecondTitleFontWeight,
  greyTextColor,
  blackTextColor,
} from "../../assets/Styles/styleVariables";

import { tags } from "../../assets/Variables/categories";
import { useFonts } from "expo-font";

import { addOrUpdateRecipe, removeRecipe } from "../store/cookingStore";
import { fetchAllProducts } from "../store/fridgeStore";
import useAuthStore from "../store/authStore";

import { translate } from "react-native-redash";

const { width } = Dimensions.get("window");

/*
  --- Main Component: RecipeCreatePage ---
*/
export default function RecipeCreatePage({ navigation, route }) {
  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });


  // Confirm deletion
  const confirmDelete = useCallback((id) => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this recipe?")) {
        removeRecipe(ctx, id)
          .then(() => navigation.navigate("CookingPage"))
          .catch((error) => console.error("Error deleting recipe:", error));
      }
    } else {
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this recipe?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            onPress: () =>
              removeRecipe(ctx, id)
                .then(() => navigation.navigate("CookingPage"))
                .catch((error) => console.error("Error deleting recipe:", error)),
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    }
  }, [ctx.userId, navigation]);

  const [fontsLoaded] = useFonts({
    "Inter": require("../../assets/fonts/Inter/Inter_18pt-Regular.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter/Inter_18pt-Bold.ttf"),
    "Inter-Title": require("../../assets/fonts/Inter/Inter_24pt-Bold.ttf"),
  });

  // Recipe data state
  const recipe = route.params?.recipe || null;
  const [title, setTitle] = useState(recipe?.title || "");
  const [description, setDescription] = useState(recipe?.description || "");
  const [id, setId] = useState(recipe?.id || "");
  const [categories, setCategories] = useState(recipe?.categories || []);
  const [mandatoryIngredients, setMandatoryIngredients] = useState(recipe?.mandatoryIngredients || []);
  const [optionalIngredients, setOptionalIngredients] = useState(recipe?.optionalIngredients || []);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
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
      setTitle("");
      setDescription("");
      setId("");
      setCategories([]);
      setMandatoryIngredients([]);
      setOptionalIngredients([]);
      setImageUri(null);
      setIsCreatingNew(true);
    }
  }, [recipe]);

  // For ingredient selection using fridge products
  const [products, setProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState(products);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const modalSearchRef = useRef(null);
  const [isMandatoryFlag, setIsMandatoryFlag] = useState(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const openCategoryModal = useCallback(() => {
    setIsCategoryModalVisible(true);
  }, []);
  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalVisible(false);
  }, []);

  const handleMultipleCategoriesSelect = useCallback((selectedCategories) => {
    setCategories(selectedCategories);
  }, []);

  useEffect(() => {
    if (ctx) {
      fetchAllProducts(ctx)
        .then((fetchedProducts) => {
          const allProducts = fetchedProducts.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setProducts(allProducts);
          setAvailableProducts(allProducts.filter((product) => !product.isArchived));
          setFilteredData(allProducts);
        })
        .catch((error) => {
          console.error("Failed to fetch fridge products:", error);
        });
    }
  }, [ctx.userId, ctx.familyId]);

  const saveOrUpdateRecipe = useCallback(() => {
    addOrUpdateRecipe(ctx, {
      id: id ? id : null,
      title,
      categories,
      mandatoryIngredients,
      optionalIngredients,
      description,
      imageUri,
    })
      .then(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "CookingPage" }],
        });
      })
      .catch((error) => {
        console.error("Failed to save recipe:", error);
        setError("Failed to save recipe. Please try again.");
      });
  }, [id, title, categories, mandatoryIngredients, optionalIngredients, description, imageUri, ctx.userId, navigation]);

  const getAvailableProducts = useCallback(() => {
    const usedIds = new Set([
      ...mandatoryIngredients.map(i => i.productId),
      ...optionalIngredients.map(i => i.productId),
    ]);
    return products.filter(p => !usedIds.has(p.id));
  }, [products, mandatoryIngredients, optionalIngredients]);

  useEffect(() => {
    setFilteredData(getAvailableProducts());
  }, [products, mandatoryIngredients, optionalIngredients, getAvailableProducts]);

  const handleSearchInput = useCallback(
    (text) => {
      setSearchQuery(text);
      let base = getAvailableProducts();
      let results = [];
      if (text) {
        results = base.filter((item) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        );
      } else {
        results = base;
      }
      results.sort((a, b) => a.name.localeCompare(b.name));
      setFilteredData(results);
    },
    [getAvailableProducts]
  );

  const addIngredient = useCallback(async (item, mandatoryFlag) => {
    try {
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
        setMandatoryIngredients((prev) => [...prev, ingredientToAdd]);
      } else {
        setOptionalIngredients((prev) => [...prev, ingredientToAdd]);
      }
      closeSearchModal();
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      setError("Failed to add ingredient. Please try again.");
    }
  }, []);

  const removeIngredient = useCallback((idToRemove, mandatoryFlag) => {
    try {
      if (mandatoryFlag) {
        setMandatoryIngredients((prev) => {
          const updated = prev.filter((ing) => (ing._id || ing.productId) !== idToRemove);
          return [...updated]; // new array ref
        });
      } else {
        setOptionalIngredients((prev) =>
          prev.filter((ing) => (ing._id || ing.productId) !== idToRemove)
        );
      }
    } catch (error) {
      console.error("Failed to remove ingredient:", error);
      setError("Failed to remove ingredient. Please try again.");
    }
  }, []);

  const checkIngredientIsAvailable = useCallback(
    (originalFridgeId) => {
      return availableProducts.some((product) => product.id === originalFridgeId);
    },
    [availableProducts]
  );

  const openIngredientSearchModal = useCallback(
    (mandatoryFlag) => {
      setFilteredData(getAvailableProducts());
      setIsMandatoryFlag(mandatoryFlag);
      
      setTimeout(() => {
        // modalSearchRef.current?.focus();
        setSearchModalVisible(true);
      }, 0);
    },
    [getAvailableProducts]
  );

  const closeSearchModal = useCallback(() => {
    setSearchModalVisible(false);
    setSearchQuery("");
    setFilteredData([]);
  }, []);

  const isSaveDisabled = useMemo(() => {
  const hasValidTitle = title.trim().length > 0;
  const hasAtLeastOneIngredient = Array.isArray(mandatoryIngredients) && mandatoryIngredients.length > 0;
  return !(hasValidTitle && hasAtLeastOneIngredient);
}, [title, mandatoryIngredients]);

useEffect(() => {
  console.log('title:', title);
  console.log('mandatoryIngredients:', mandatoryIngredients);
  console.log('isSaveDisabled:', isSaveDisabled);
}, [isSaveDisabled]);

  const [isEditing, setIsEditing] = useState(false);

  const scrollA = useRef(new Animated.Value(0)).current;

  const memoizedImageStyle = useMemo(() => ({
    width,
    height: width,
    transform: [
      { translateY: scrollA },
      {
        scale: scrollA.interpolate({
          inputRange: [-width, 0, width],
          outputRange: [2, 1, 1],
        }),
      },
    ],
  }), [scrollA]);

  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShowSub = Keyboard.addListener('keyboardWillShow', e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: 400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
    });
    const keyboardWillHideSub = Keyboard.addListener('keyboardWillHide', e => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: 350,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardWillShowSub.remove();
      keyboardWillHideSub.remove();
    };
  }, []);

  
return (
  <Animated.View style={[styles.RecipeCreatePage, { transform: [{ translateY: Animated.multiply(keyboardHeight, -0.6) }] } ]}>
    <Animated.ScrollView
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollA } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
      nestedScrollEnabled
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.RecipeCreatePage_ContentWrapper}>
        <ImageWithUpload
          imageUri={imageUri}
          animatedStyle={memoizedImageStyle}
          setImageUri={setImageUri}
          enableStaticImages={false}
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
            <View style={[styles.productDataEntryInput, styles.productTags]}>
              <ButtonBouncing label="Add tags +" toScale={0.95} onPress={openCategoryModal}
                style={styles.innerTagStyle} textStyle={styles.innerTextStyle}/>
              {categories && categories.length > 0 && categories.map((category, index) => (
                <Tag key={index} name={category.tagName} type={category.tagType} icon={category.tagIcon} />
              ))}
            </View>
          </View>

            <View style={styles.ListOfIngredients}>
              <View style={styles.IngredientsHeader}>
                <Text style={styles.ListOfIngredients_Text}>Mandatory Ingredients</Text>
                <ButtonBouncing label={'Add'}
                  onPress={() => openIngredientSearchModal(true)}
                  style={styles.addIngredient_Button} textStyle={styles.addIngredient_ButtonText} innerStyle={styles.innerAddButt}/>
              </View>
              {mandatoryIngredients.map((ingredient) => (
                <View key={ingredient._id || ingredient.productId} style={styles.rowFront}>
                  <IngredientItem
                    ingredient={ingredient}
                    isMandatory={true}
                    onRemove={removeIngredient}
                    isEditing={isEditing}
                    isCreatingNew={isCreatingNew}
                    isAvailable={checkIngredientIsAvailable(ingredient.productId)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.ListOfIngredients}>
              <View style={styles.IngredientsHeader}>
                  <Text style={styles.ListOfIngredients_Text}>Optional Ingredients</Text>
                  <ButtonBouncing label={'Add'}
                    onPress={() => openIngredientSearchModal(false)}
                    style={styles.addIngredient_Button} textStyle={styles.addIngredient_ButtonText} innerStyle={styles.innerAddButt}/>
                </View>
                {optionalIngredients.map((ingredient) => (
                  <View key={ingredient._id || ingredient.productId} style={styles.rowFront}>
                    <IngredientItem
                      ingredient={ingredient}
                      isMandatory={false}
                      onRemove={removeIngredient}
                      isEditing={isEditing}
                      isCreatingNew={isCreatingNew}
                      isAvailable={checkIngredientIsAvailable(ingredient.productId)}
                    />
                  </View>
                ))}
            </View>
        </View>

        
        <View style={{ backgroundColor: "white", width: "90%", alignSelf: "center", paddingTop: 20 }}>
          <View style={styles.productDataEntry}>
            <Text style={{ fontFamily: MainFont_Title, fontSize: 18, marginBottom: 6 }}>Notes</Text>
            <TextInput
              style={[styles.productDataEntryInput, styles.productNotes]}
              autoCapitalize="sentences"
              value={description}
              onChangeText={setDescription}
              placeholder="Do you need instructions how to cook it?"
              placeholderTextColor="#9e9e9e"
              multiline={true}
              textAlignVertical="top"
            />
          </View>
        </View>

        <SearchModal
          isSearchModalVisible={isSearchModalVisible}
          closeSearchModal={closeSearchModal}
          handleSearch={handleSearchInput}
          filteredData={filteredData}
          isRecipeCreate={true}
          addProduct={addIngredient}
          isMandatory={isMandatoryFlag}
          // modalSearchRef={modalSearchRef}
        />

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
    </Animated.ScrollView>

    <View style={styles.buttonPanel}>
      {!isCreatingNew && (
        <ButtonBouncing style={{ borderRadius: 30 }}
          onPress={() => confirmDelete(id)}
          label={
            <View style={styles.Button_DeleteRecipe}>
              <Entypo name="trash" size={28} style={styles.Button_SaveRecipe_Text}/>
            </View>
          }
        />
      )}

      <ButtonBouncing
        innerStyle={styles.Button_SaveRecipe}
        style={[
          styles.Button_SaveRecipe,
          isSaveDisabled && styles.Button_SaveRecipeDisabled,
          isCreatingNew && styles.Button_SaveRecipeAlone,
        ]}
        onPress={saveOrUpdateRecipe}
        isDisabled={isSaveDisabled}
        label={<Text style={styles.Button_UpdateProduct_Text}>Save</Text>}
        toScale={0.9}
      />
    </View>

    <ButtonGoBack navigation={navigation} />
  </Animated.View>
)
}

const styles = StyleSheet.create({


  innerTagStyle: {
    // paddingVertical: 16,
    borderRadius: 25,
    paddingVertical: 2,
    paddingHorizontal: 2,
    // borderColor: 'grey',
    marginRight: 6,
    marginLeft: -6,
    // borderWidth: 1,
  },
  innerTextStyle: {
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize,
    color: '#444',
    padding: 6,
    backgroundColor: backgroundColor,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'grey',
  },


  RecipeCreatePage: {
    flex: 1,
    backgroundColor: "white",
  },
  RecipeCreatePage_ContentWrapper: {
    alignItems: "center",
    // backgroundColor: 'white',
  },
  ProductCreatePicture: (scrollA) => ({
    width: width,
    height: width,
    transform: [
      { translateY: scrollA },
      {
        scale: scrollA.interpolate({
          inputRange: [-width, 0, width],
          outputRange: [2, 1, 1],
        }),
      },
    ],
  }),
  ProductPicture_Button: {
    zIndex: 3,
    height: 40,
    width: 40,
    borderRadius: 30,
    backgroundColor: "#fff",
    position: "absolute",
    top: width - 140,
    left: width * 0.84,
  },
  productDataEntry_Wrapper: {
    width: "90%",
    backgroundColor: "#fff",
    marginTop: -90,
    paddingTop: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  productDataEntry: {
    paddingHorizontal: 10,
    justifyContent: "center",
    borderColor: "#ddd",
    marginVertical: -4,
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
    borderColor: "#ddd",
  },
  productTags: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
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
    height: 120,
    paddingVertical: 10,
    lineHeight: Platform.OS === "android" ? 24 : 20,
    borderColor: "#ddd",
    borderLeftWidth: 2,
    // marginBottom: 60,
  },
  ListOfIngredients: {
    // marginTop: 10,
    width: "100%",
    // paddingHorizontal: 10,
    // borderWidth: 1,
    // borderColor: "#ddd",
  },
  IngredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "white",
    width: "100%",
    marginHorizontal: "auto",
  },
  addIngredient_Button: {
    marginRight: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: addButtonColor,
    // paddingVertical: 2,
    // paddingHorizontal: 2,
  },
  addIngredient_ButtonText: {
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize,
    color: addButtonColor,
  },
  innerAddButt: {
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: addButtonColor,
  },
  ListOfIngredients_Text: {
    fontWeight: SecondTitleFontWeight,
    fontSize: SecondTitleFontSize + 2,
  },
  SubListOfIngredients: {
    marginVertical: 6,
    marginBottom: 10,
  },
  buttonPanel: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    // marginBottom: 20,
    paddingHorizontal: "6%",
    position: "absolute",
    marginTop: 20,
    bottom: 20,
    backgroundColor: 'transparent',
  },
  Button_SaveRecipe: {
    backgroundColor: buttonColor,
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
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
    width: "100%",
  },
  Button_DeleteRecipe: {
    borderRadius: 60,
    width: width / 9,
    height: width / 9,
    backgroundColor: deleteButtonColor,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: deleteButtonColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  Button_SaveRecipeDisabled: {
    backgroundColor: "#A9A9A9",
    shadowColor: "#A9A9A9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
});
