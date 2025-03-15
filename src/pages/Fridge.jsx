import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

// import { ServiceFactory } from "../../services/ServiceFactory";

import CollapsibleSection from "../components/CollapsableSection";
import ModalCreateProduct from "../components/fridge/ModalCreateProduct";

import ProductCard from "../components/fridge/ProductCard";
import SearchInput from '../components/Search';
import AddNewButton from "../components/Button_AddNew";

import { backgroundColor, buttonColor, MainFont, TextFontSize } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';
import { categoryNames } from "../../assets/Variables/categories";

import useAuthStore from '../store/authStore';
import {fetchAvailableProducts, fetchArchivedProducts} from '../store/fridgeStore'; 

import { fetchUserRecipes } from "../store/cookingStore";
import { fetchUserData } from "../store/basketStore";

const { width } = Dimensions.get('window');

export default function FridgePage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [filteredAvailable, setFilteredAvailable] = useState([]);
  const [filteredArchived, setFilteredArchived] = useState([]);
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

  const refreshProducts = async () => {
      try {
          const fetchedArchived = await fetchArchivedProducts(userId);
          const fetchedAvailable = await fetchAvailableProducts(userId);

          setAvailableProducts(fetchedAvailable);
          setArchivedProducts(fetchedArchived);
          setFilteredAvailable(fetchedAvailable);
          setFilteredArchived(fetchedArchived);
      } catch (error) {
          console.error("Failed to fetch products:", error);
      }
  };

  const refreshUsedIngredients = async () => {
    if (userId) {
        Promise.all([
            fetchUserRecipes(userId),
            fetchUserData(userId)
        ])
        .then(([cookingData, userData]) => {
            const recipeIngredientIds = cookingData.recipes
            .flatMap(recipe => [
                ...(recipe.mandatoryIngredients || []),
                ...(recipe.optionalIngredients || [])
            ])
            .map(ingredient => ingredient.id);
            
            const basketProductIds = (userData.basket?.products || []).map(product => product.originalFridgeId);
            console.log("Basket product IDs:", basketProductIds);
            // Combine both arrays and remove duplicates using a Set
            const combinedIds = [...new Set([...recipeIngredientIds, ...basketProductIds])];
            
            setUsedIngredients(combinedIds);
        })
        .catch(error => {
            console.error("Failed to fetch recipes", error);
        });
    }
};

  useFocusEffect(
    React.useCallback(async () => {
        if (userId) {
            refreshProducts();
            refreshUsedIngredients();
        }
    }, [userId])
  );

  useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredAvailable(availableProducts.filter(product => selectedCategory === 'All' || product.category.tagName === selectedCategory));
            setFilteredArchived(archivedProducts.filter(product => selectedCategory === 'All' || product.category.tagName === selectedCategory));
            return;
        }
        const lowerCaseQuery = searchQuery.toLowerCase();
        setFilteredAvailable(
            availableProducts.filter(product => product.name.toLowerCase().includes(lowerCaseQuery)&&(selectedCategory == 'All' || product.category.tagName === selectedCategory))
        );
        setFilteredArchived(
            archivedProducts.filter(product => product.name.toLowerCase().includes(lowerCaseQuery)&&(selectedCategory == 'All' || product.category.tagName === selectedCategory))
        );
    }, [searchQuery, availableProducts, archivedProducts, selectedCategory]);

    const filterByCategory = (category) => {
        setSelectedCategory(category);
    };

  return (
      <View style={styles.FridgePage}>
          <ScrollView>
              <View style={styles.FridgePage_ContentWrapper}>
                  {/* <TextInput style={styles.searchInput} placeholder="Find a product" value={searchQuery} onChangeText={setSearchQuery}/> */}
                  <SearchInput placeholder={'Find a product'} query={searchQuery} onChangeText={setSearchQuery}></SearchInput>

                  <View style={styles.ProductFilter}>
                      {['All', ...categoryNames].map((category, index) => (
                          <TouchableOpacity key={index} 
                          style={[styles.ProductFilterCategory, selectedCategory === category && styles.SelectedCategory,
                          ]}
                           onPress={() => filterByCategory(category)}>
                              <Text style={[styles.ProductFilterCategory_Text]}>{category}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>   

                  <CollapsibleSection title="Available Products">
                        {filteredAvailable.length > 0 ? (
                            filteredAvailable.map(product => (
                                <ProductCard
                                    key={product.id}
                                    onOpenModal={openModal}
                                    product={product} navigation={navigation}
                                    onChange={refreshProducts}
                                    onMoveToBasket={refreshUsedIngredients}
                                />
                            ))
                        ) : (
                            <Text style={{paddingLeft: 4, fontFamily: MainFont}}>No available products found.</Text>
                        )}
                    </CollapsibleSection>
                
                    <CollapsibleSection title="Archived Products">
                        {filteredArchived.length > 0 ? (
                            filteredArchived.map(product => (
                                <ProductCard
                                    key={product.id}
                                    onOpenModal={openModal}
                                    product={product} navigation={navigation}
                                    onChange={refreshProducts}
                                    onMoveToBasket={refreshUsedIngredients}
                                />
                            ))
                        ) : (
                            <Text style={{paddingLeft: 4, fontFamily: MainFont}}>No archived products found.</Text>
                        )}
                    </CollapsibleSection>

                    <ModalCreateProduct
                        isVisible={isModalVisible}
                        onClose={closeModal}
                        onChange={refreshProducts}
                        product={selectedProduct ? { 
                            ...selectedProduct, 
                            category: selectedProduct.category || { name: "Other", icon: "❓", type: "general" } 
                        } : null}
                        usedIngredients={usedIngredients}
                    />
              </View>
          </ScrollView>
{/* 
          <TouchableOpacity style={styles.Button_AddProduct} onPress={openModal}>
              <Text style={styles.Button_AddProduct_Text}>+</Text>
          </TouchableOpacity> */}

          <AddNewButton creativeAction={openModal} />
      </View>
  );
}

// Task(product) will have: Id & Content 


// Styles

const styles = StyleSheet.create({
    FridgePage: {
      flex: 1,
      backgroundColor: backgroundColor,
      alignItems: 'center',
      width: width,
    },

    FridgePage_ContentWrapper: {
      width: width * 0.96,
    //   borderColor: 'black',
    //   borderWidth: 1,
    },

    ProductFilter: {
      flexDirection: 'row',
      marginBottom: 10,
    //   marginLeft: 6,
      overflow: 'hidden',
      flexWrap: 'wrap',
    },

    ProductFilterCategory: {
      marginRight: 10,
      marginBottom: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ccc',

      shadowColor: "darkgrey", 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 1, 
    },

    ProductFilterCategory_Text: {
        fontFamily: MainFont,
        fontSize: TextFontSize - 2,
    },

    SelectedCategory: {
        backgroundColor: buttonColor,
    },
  
  });
