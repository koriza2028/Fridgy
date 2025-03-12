import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
        Platform, StyleSheet, Dimensions, RefreshControl } from 'react-native';

import MealCard from '../components/cooking/MealCard';
import SearchInput from '../components/Search';
import FiltersRecipeCategory from '../components/cooking/FiltersRecipeCategory';

import { buttonColor, backgroundColor, MainFont, MainFont_Bold, SecondTitleFontSize, SecondTitleFontWeight, addButtonColor } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import { tags } from '../../assets/Variables/categories';
import AddNewButton from '../components/Button_AddNew';

import useAuthStore from '../store/authStore';
import { fetchUserRecipes, removeRecipe } from '../store/cookingStore';
import { fetchAvailableProducts } from '../store/fridgeStore';

const { width } = Dimensions.get('window');

export default function CookingPage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  // recipeBook stores the full list; filteredData is used to render the list.
  const [recipeBook, setRecipeBook] = useState({ recipes: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [fridgeProducts, setFridgeProducts] = useState([]);
  // New state to hold selected filter categories
  const [selectedFilters, setSelectedFilters] = useState([]);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchUserRecipes(userId)
          .then(cookingData => {
            setRecipeBook(cookingData);
            setFilteredData(cookingData.recipes || []);
          })
          .catch(error => {
            console.error("Failed to fetch recipes", error);
          });
        fetchAvailableProducts(userId)
        .then(products => {
          setFridgeProducts(products);
        })
      }
    }, [userId])
  );

  // Debounce search input for performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Combined filtering: apply search query and then category filters.
  useEffect(() => {
    if (!recipeBook || !recipeBook.recipes) return;
  
    let results = recipeBook.recipes;
  
    // Filter by search query if not empty.
    if (debouncedQuery.trim()) {
      results = results.filter(recipe =>
        recipe.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }
  
    // If any filters are selected, further filter by recipe categories.
    if (selectedFilters.length > 0) {
      results = results.filter(recipe => {
        if (!recipe.categories || !Array.isArray(recipe.categories)) return false;
        // Map recipe categories to lowercase strings (if they're objects, use tagName)
        const recipeCats = recipe.categories.map(cat => {
          if (typeof cat === 'string') return cat.toLowerCase();
          if (typeof cat === 'object' && cat.tagName) return cat.tagName.toLowerCase();
          return "";
        });
        // Map selectedFilters similarly (if they're objects, use tagName)
        const filterCats = selectedFilters.map(f => {
          if (typeof f === 'string') return f.toLowerCase();
          if (typeof f === 'object' && f.tagName) return f.tagName.toLowerCase();
          return "";
        });
        // Return true if at least one filter exists in recipeCats
        return recipeCats.some(cat => filterCats.includes(cat));
      });
    }
  
    setFilteredData(results);
  }, [debouncedQuery, recipeBook, selectedFilters]);
  

  // Handle search input change
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const handleRemoveRecipe = async (recipeId) => {
    if (!userId) return;
    const updatedCooking = await removeRecipe(userId, recipeId);
    setRecipeBook(updatedCooking);
    const results = updatedCooking.recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
    setFilteredData(results);
  };

  // Pull-to-refresh handling
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userId) {
      fetchUserRecipes(userId)
        .then(cookingData => {
          setRecipeBook(cookingData);
          setFilteredData(cookingData.recipes || []);
          setRefreshing(false);
        })
        .catch(error => {
          console.error("Failed to refresh recipes", error);
          setRefreshing(false);
        });
    }
  }, [userId]);

  checkIngredientIsAvailable = (originalFridgeId) => {
    // Check if the ingredients are available in the fridge
    return fridgeProducts.some(product => product.id === originalFridgeId);
  };

  checkMandatoryIngredientsAreAvailable = (recipeId) => {
    // Check if the mandatory ingredients are available in the fridge
    const recipe = recipeBook.recipes.find(recipe => recipe.id === recipeId);
    if (!recipe || !recipe.mandatoryIngredients) return false;
    for (const ingredient of recipe.mandatoryIngredients) {
      if (!checkIngredientIsAvailable(ingredient.id)) return false;
    }
    return true;
  };

  return (
    <View style={styles.CookingPage}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.CookingPage_ContentWrapper}>
          <SearchInput 
            placeholder={'Find a recipe'} 
            query={searchQuery} 
            onChangeText={handleSearch} 
          />
          {/* Pass onFilterChange callback to update selected filters */}
          <FiltersRecipeCategory 
            filterRules={tags} 
            onFilterChange={setSelectedFilters} 
          />
          <Text style={styles.SuggestedMeals_Text}>Suggested meals:</Text>
          <View style={styles.MealList_Wrapper}>
            {filteredData.length > 0 || searchQuery !== "" ? (
              filteredData.map((recipe) => (
                <MealCard
                  navigation={navigation}
                  recipe={recipe}
                  key={recipe.id}
                  isAvailable={checkMandatoryIngredientsAreAvailable(recipe.id)}
                />
              ))
            ) : (
              <View/>
            )}
          </View>
        </View>
      </ScrollView>
      <AddNewButton creativeAction={() => navigation.navigate('RecipeCreatePage')} />
    </View>
  );
}

const styles = StyleSheet.create({
  CookingPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    alignItems: 'center',
    width: width,
  },
  CookingPage_ContentWrapper: {
    width: width * 0.96,
    paddingBottom: 10,
  },
  SuggestedMeals_Text: {
    fontSize: SecondTitleFontSize + 2,
    fontWeight: SecondTitleFontWeight,
    fontFamily: MainFont_Bold
  },
  MealList_Wrapper: {
    width: '100%',
    paddingTop: 10,
  },
});
