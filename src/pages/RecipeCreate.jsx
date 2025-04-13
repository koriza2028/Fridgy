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
  Keyboard,
  Animated,
  // Image
} from "react-native";
import { Image } from 'expo-image';
import { SwipeListView } from "react-native-swipe-list-view";
const AnimatedSwipeListView = Animated.createAnimatedComponent(SwipeListView);

import ButtonGoBack from "../components/ButtonGoBack";
import IngredientItem from "../components/cooking/IngredientCard";
import Tag from "../components/cooking/Tag";
import ModalProductCategoryPicker from "../components/fridge/ModalProductCategoryPicker";
import SearchModal from "../components/SearchModal";
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

// NEW IMPORTS FOR IMAGE UPLOAD
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getMetadata, getDownloadURL } from "firebase/storage";
import app from "../firebaseConfig";
import { translate } from "react-native-redash";

const { width } = Dimensions.get("window");

/* 
  --- HeaderImage Component ---
  This component handles only the image.
  It uses useMemo to cache its animated style and source,
  and React.memo to skip re-rendering if these props remain unchanged.
*/
const HeaderImage = React.memo(({ imageUri, scrollA, handleImageUpload }) => {
  const memoizedImageStyle = useMemo(() => ({
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
  }), [scrollA]);

  const memoizedSource = useMemo(() => {
    if (imageUri) {
      // Image.prefetch(imageUri); // try to cache it ahead of time
      return { uri: imageUri };
    } else {
      return require("../../assets/ProductImages/banana_test.png");
    }
  }, [imageUri]);

  return (
    <Animated.View style={memoizedImageStyle}>
      <Image
        source={memoizedSource}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />
      <Pressable onPress={handleImageUpload} style={styles.ProductPicture_Button} />
    </Animated.View>
  );
});

/*
  --- Main Component: RecipeCreatePage ---
*/
export default function RecipeCreatePage({ navigation, route }) {
  const userId = useAuthStore((state) => state.user?.uid);

  // Confirm deletion
  const confirmDelete = useCallback((id) => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to delete this recipe?")) {
        removeRecipe(userId, id)
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
              removeRecipe(userId, id)
                .then(() => navigation.navigate("CookingPage"))
                .catch((error) => console.error("Error deleting recipe:", error)),
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    }
  }, [userId, navigation]);

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
    if (userId) {
      fetchAllProducts(userId)
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
  }, [userId]);

  // Animated value defined once
  const scrollA = useRef(new Animated.Value(0)).current;

  // Wrap handleImageUpload so its identity is stable.
  const handleImageUpload = useCallback(async () => {
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
        const metadata = {
          cacheControl: 'public,max-age=86400', // cache for 1 day
          contentType: blob.type || 'image/jpeg',
        };
  
        await uploadBytes(storageRef, blob, metadata);

        const downloadUrl = await getDownloadURL(storageRef);
        setImageUri(downloadUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  }, []);

  const saveOrUpdateRecipe = useCallback(() => {
    addOrUpdateRecipe(userId, {
      id: id ? id : null,
      title,
      categories,
      mandatoryIngredients,
      optionalIngredients,
      description,
      imageUri,
    })
      .then(() => {
        navigation.navigate("CookingPage");
      })
      .catch((error) => {
        console.error("Failed to save recipe:", error);
        setError("Failed to save recipe. Please try again.");
      });
  }, [id, title, categories, mandatoryIngredients, optionalIngredients, description, imageUri, userId, navigation]);

  const handleSearchInput = useCallback(
    (text) => {
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
    },
    [products]
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
      setProducts((prev) => prev.filter((product) => product.id !== item.id));
    } catch (error) {
      console.error("Failed to add ingredient:", error);
      setError("Failed to add ingredient. Please try again.");
    }
  }, []);

  const removeIngredient = useCallback((idToRemove, mandatoryFlag) => {
    try {
      if (mandatoryFlag) {
        setMandatoryIngredients((prev) =>
          prev.filter((ing) => (ing._id || ing.productId) !== idToRemove)
        );
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
      setFilteredData(products);
      setIsMandatoryFlag(mandatoryFlag);
      setSearchModalVisible(true);
      setTimeout(() => {
        modalSearchRef.current?.focus();
      }, 100);
    },
    [products]
  );

  const closeSearchModal = useCallback(() => {
    setSearchModalVisible(false);
    setSearchQuery("");
    setFilteredData([]);
  }, []);

  const isSaveDisabled = useMemo(() => title.trim() === "" || mandatoryIngredients.length === 0, [title, mandatoryIngredients]);
  const [isEditing, setIsEditing] = useState(false);

  const combinedData = useMemo(() => {
    const data = [];
    data.push({
      type: "header",
      title: "Mandatory Ingredients",
      key: "mandatory-header",
    });
    mandatoryIngredients.forEach((ingredient) => {
      data.push({
        type: "ingredient",
        ingredient,
        mandatory: true,
        key: ingredient._id || ingredient.productId,
      });
    });
    data.push({
      type: "header",
      title: "Optional Ingredients",
      key: "optional-header",
    });
    optionalIngredients.forEach((ingredient) => {
      data.push({
        type: "ingredient",
        ingredient,
        mandatory: false,
        key: ingredient._id || ingredient.productId,
      });
    });
    return data;
  }, [mandatoryIngredients, optionalIngredients]);

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === "header") {
        return (
          <View style={styles.IngredientsHeader}>
            <Text style={styles.ListOfIngredients_Text}>{item.title}</Text>
            <Pressable
              onPress={() =>
                item.title === "Mandatory Ingredients"
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
          <View style={styles.ingredientWrapper}>
            <View style={styles.rowFront}>
              <IngredientItem
                ingredient={item.ingredient}
                isMandatory={item.mandatory}
                onRemove={removeIngredient}
                isEditing={isEditing}
                isCreatingNew={isCreatingNew}
                isAvailable={checkIngredientIsAvailable(item.ingredient.productId)}
              />
            </View>
          </View>
        );
      }
    },
    [isEditing, isCreatingNew, openIngredientSearchModal, removeIngredient, checkIngredientIsAvailable]
  );

  const renderHiddenItem = useCallback(
    ({ item }) => {
      if (item.type === "header") return null;
      return (
        <View style={styles.rowBack}>
          <View style={styles.rowBackContent}>
            <Pressable
              style={styles.deleteButton}
              onPress={() =>
                removeIngredient(item.ingredient._id || item.ingredient.productId, item.mandatory)
              }
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [removeIngredient]
  );

  // Memoize the header that contains the image and text inputs.
  const RenderedHeader = useMemo(() => {
    return (
      <View style={styles.RecipeCreatePage_ContentWrapper}>
        <HeaderImage
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
    );
  }, [
    imageUri,
    scrollA,
    handleImageUpload,
    title,
    categories,
    isCategoryModalVisible,
    searchQuery,
    filteredData,
    isSearchModalVisible,
    isMandatoryFlag,
  ]);

  const ListFooter = useMemo(() => {
    return (
      <View style={{ backgroundColor: "white", width: "90%", marginHorizontal: "auto", paddingTop: 20 }}>
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
    );
  }, [description]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.RecipeCreatePage}>
        <AnimatedSwipeListView
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollA } } }], { useNativeDriver: true })}
          data={combinedData}
          keyExtractor={(item) => item.key}
          ListHeaderComponent={RenderedHeader}
          ListFooterComponent={ListFooter}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe
          disableScrollOnSwipe
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 100 }}
          swipeRowDisabled={({ item }) => item.type === "header"}
        />
        <View style={styles.buttonPanel}>
          {!isCreatingNew && (
            <Pressable style={styles.Button_DeleteRecipe} onPress={() => confirmDelete(id)}>
              <Text style={styles.Button_SaveRecipe_Text}>
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
}

const styles = StyleSheet.create({
  rowFront: {
    backgroundColor: "white",
    minHeight: 70,
    justifyContent: "center",
    width: "100%",
  },
  ingredientWrapper: {
    width: "90%",
    alignSelf: "center",
  },
  rowBack: {
    position: "absolute",
    top: 10,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  rowBackContent: {
    width: "90%",
    height: "100%",
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  deleteButton: {
    width: 75,
    height: 50,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  RecipeCreatePage: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  RecipeCreatePage_ContentWrapper: {
    alignItems: "center",
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
  },
  ListOfIngredients: {
    marginTop: 10,
    width: "100%",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  IngredientsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: "white",
    width: "90%",
    marginHorizontal: "auto",
  },
  addIngredient_Button: {
    marginRight: 14,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: addButtonColor,
    paddingVertical: 4,
    paddingHorizontal: 6,
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
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
    position: "absolute",
    bottom: 2,
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
