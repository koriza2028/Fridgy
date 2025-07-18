import React, { useState, useCallback, useMemo } from "react";
import { View, Text, Dimensions, ScrollView, Pressable, StyleSheet, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";


import CollapsibleSection from "../components/CollapsableSection";
import ModalCreateProduct from "../components/fridge/ModalCreateProduct";
import ProductCard from "../components/fridge/ProductCard";
import SearchInput from '../components/Search';
import AddNewButton from "../components/Button_AddNew";


import { backgroundColor, buttonColor, MainFont, MainFont_Bold, MainFont_SemiBold, TextFontSize } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';
import { categoryNames } from "../../assets/Variables/categories";
import useAuthStore from '../store/authStore';
import useProductStore from '../store/productStore';
import { fetchUserData } from "../store/basketStore";

const { width, height } = Dimensions.get('window');

export default function FridgePage({ navigation }) {
  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });

  const { available, archived, refreshProducts } = useProductStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [usedIngredients, setUsedIngredients] = useState([]);

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
  });

  const openModal = (product = null) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  const refreshUsedIngredients = async () => {
    if (ctx) {
      try {
        const userData = await fetchUserData(ctx);
        const recipeIngredientIds = (userData.cooking?.recipes || [])
          .flatMap(recipe => [...(recipe.mandatoryIngredients || []), ...(recipe.optionalIngredients || [])])
          .map(ingredient => ingredient.id);
        const basketProductIds = (userData.basket?.products || []).map(product => product.productId);
        const combinedIds = [...new Set([...recipeIngredientIds, ...basketProductIds])];
        setUsedIngredients(combinedIds);
      } catch (error) {
        console.error("Failed to fetch recipes", error);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (ctx) {
        refreshProducts(ctx);
        refreshUsedIngredients();
      }
    }, [ctx.userId, ctx.familyId])
  );

  const filteredAvailable = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return available.filter(product => {
      const matchCategory = selectedCategory === 'All' || product.category.tagName === selectedCategory;
      const matchQuery = product.name.toLowerCase().includes(lower);
      return matchCategory && matchQuery;
    });
  }, [available, searchQuery, selectedCategory]);

  const filteredArchived = useMemo(() => {
    const lower = searchQuery.toLowerCase();
    return archived.filter(product => {
      const matchCategory = selectedCategory === 'All' || product.category.tagName === selectedCategory;
      const matchQuery = product.name.toLowerCase().includes(lower);
      return matchCategory && matchQuery;
    });
  }, [archived, searchQuery, selectedCategory]);

  const filterByCategory = (category) => {
    setSelectedCategory(category);
  };

  return (
    <View style={styles.FridgePage}>
      <ScrollView>
        <View style={styles.FridgePage_ContentWrapper}>
          <SearchInput placeholder={'Find a product'} query={searchQuery} onChangeText={setSearchQuery} />

          <View style={styles.ProductFilter}>
            {['All', ...categoryNames].map((category, index) => (
              <Pressable key={index}
                style={[styles.ProductFilterCategory, selectedCategory === category && styles.SelectedCategory]}
                onPress={() => filterByCategory(category)}>
                <Text style={[styles.ProductFilterCategory_Text, selectedCategory === category && styles.SelectedCategory_Text]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>


          {filteredAvailable.length === 0 && filteredArchived.length === 0 ? (
                <View style={{ alignItems: 'center', position: 'absolute', width: width, top: height*0.3, paddingLeft: 10 }}>
                  <Image
                    source={require('../../assets/ProductImages/emptyFridge.png')}
                    style={{ width: 204, height: 200, resizeMode: 'contain' }}
                  />
                  <Text style={{ fontFamily: MainFont, marginTop: 10 }}>
                    Your fridge is empty. Start adding some products!
                  </Text>
                </View>
              ) : (
                <>
                  {filteredAvailable.length > 0 && (
                    <CollapsibleSection title="Available Products">
                      {filteredAvailable.map(product => (
                        <ProductCard
                          key={product.id}
                          onOpenModal={openModal}
                          product={product}
                          navigation={navigation}
                          onChange={() => refreshProducts(ctx)}
                          onMoveToBasket={refreshUsedIngredients}
                        />
                      ))}
                    </CollapsibleSection>
                  )}

                  {filteredArchived.length > 0 && (
                    <CollapsibleSection title="Currently not in fridge">
                      {filteredArchived.map(product => (
                        <ProductCard
                          key={product.id}
                          onOpenModal={openModal}
                          product={product}
                          navigation={navigation}
                          onChange={() => refreshProducts(ctx)}
                          onMoveToBasket={refreshUsedIngredients}
                        />
                      ))}
                    </CollapsibleSection>
                  )}
                </>
              )}

          {/* {isModalVisible && ( */}
            <ModalCreateProduct
              isVisible={isModalVisible}
              onClose={closeModal}
              onChange={() => refreshProducts(ctx)}
              product={selectedProduct ? {
                ...selectedProduct,
                category: selectedProduct.category || { name: "Other", icon: "❓", type: "general" }
              } : null}
              usedIngredients={usedIngredients}
            />
          {/* )} */}


        </View>
      </ScrollView>

      <AddNewButton creativeAction={openModal} label={"+"}/>
    </View>
  );
}

const styles = StyleSheet.create({
  FridgePage: {
    flex: 1,
    backgroundColor: backgroundColor,
    alignItems: 'center',
    width: width,
  },
  FridgePage_ContentWrapper: {},
  
  ProductFilter: {
    flexDirection: 'row',
    marginBottom: 10,
    marginHorizontal: 10,
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  ProductFilterCategory: {
    marginRight: 10,
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  ProductFilterCategory_Text: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
  },
  SelectedCategory: {
    backgroundColor: buttonColor,
  },
  SelectedCategory_Text: {
    color: 'white',
    fontFamily: MainFont_SemiBold,
  },
});