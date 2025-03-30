import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Text, View, Pressable, ScrollView, RefreshControl, StyleSheet, Dimensions } from 'react-native';

import MealCard from '../components/cooking/MealCard';
import SearchInput from '../components/Search';
import FiltersRecipeCategory from '../components/cooking/FiltersRecipeCategory';
import AddNewButton from '../components/Button_AddNew';

import { buttonColor, backgroundColor, MainFont, MainFont_Bold, SecondTitleFontSize, SecondTitleFontWeight, addButtonColor } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import { tags } from '../../assets/Variables/categories';
import useAuthStore from '../store/authStore';
import { fetchEnrichedRecipes } from '../store/cookingStore';
import { fetchAvailableProducts } from '../store/fridgeStore';

const { width } = Dimensions.get('window');

export default function CookingPage({ navigation }) {
  const userId = useAuthStore((state) => state.user?.uid);

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  // recipeBook stores the full list of enriched recipes.
  const [recipeBook, setRecipeBook] = useState({ recipes: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [fridgeProducts, setFridgeProducts] = useState([]);
  // Selected filters for recipe categories.
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Pull-to-refresh state.
  const [refreshing, setRefreshing] = useState(false);

  // Fetch enriched recipes and available fridge products.
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchEnrichedRecipes(userId)
          .then(enrichedData => {
            setRecipeBook({ recipes: enrichedData });
            setFilteredData(enrichedData || []);
          })
          .catch(error => {
            console.error("Failed to fetch recipes", error);
          });
        fetchAvailableProducts(userId)
          .then(products => {
            setFridgeProducts(products);
          })
          .catch(error => {
            console.error("Failed to fetch available products", error);
          });
      }
    }, [userId])
  );

  // Debounce search input.
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

    if (debouncedQuery.trim()) {
      results = results.filter(recipe =>
        recipe.title.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
    }

    if (selectedFilters.length > 0) {
      results = results.filter(recipe => {
        if (!recipe.categories || !Array.isArray(recipe.categories)) return false;
        const recipeCats = recipe.categories.map(cat => {
          if (typeof cat === 'string') return cat.toLowerCase();
          if (typeof cat === 'object' && cat.tagName) return cat.tagName.toLowerCase();
          return "";
        });
        const filterCats = selectedFilters.map(f => {
          if (typeof f === 'string') return f.toLowerCase();
          if (typeof f === 'object' && f.tagName) return f.tagName.toLowerCase();
          return "";
        });
        return recipeCats.some(cat => filterCats.includes(cat));
      });
    }

    setFilteredData(results);
  }, [debouncedQuery, recipeBook, selectedFilters]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userId) {
      fetchEnrichedRecipes(userId)
        .then(enrichedData => {
          setRecipeBook({ recipes: enrichedData });
          setFilteredData(enrichedData || []);
          setRefreshing(false);
        })
        .catch(error => {
          console.error("Failed to refresh recipes", error);
          setRefreshing(false);
        });
    }
  }, [userId]);

  // Check if an ingredient (by its reference) is available in the fridge.
  const checkIngredientIsAvailable = (ingredient) => {
    const key = ingredient.productId || ingredient.id;
    return fridgeProducts.some(product => product.id === key);
  };

  // Check if all mandatory ingredients for a recipe are available.
  const checkMandatoryIngredientsAreAvailable = (recipeId) => {
    const recipe = recipeBook.recipes.find(recipe => recipe.id === recipeId);
    if (!recipe || !recipe.mandatoryIngredients) return false;
    for (const ingredient of recipe.mandatoryIngredients) {
      // Use productId if present.
      if (!checkIngredientIsAvailable(ingredient)) return false;
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
          <FiltersRecipeCategory 
            filterRules={tags} 
            onFilterChange={setSelectedFilters} 
          />

          <View style={styles.MealList_Wrapper}>
            <Text style={styles.SuggestedMeals_Text}>Available meals</Text>
            {filteredData.length > 0 || searchQuery !== "" ? (
              <>
                <View style={styles.AvailableMeals_Section}>
                  {filteredData
                    .filter((recipe) => checkMandatoryIngredientsAreAvailable(recipe.id))
                    .map((recipe) => (
                      <MealCard
                        navigation={navigation}
                        recipe={recipe}
                        key={recipe.id}
                        isAvailable={true}
                      />
                    ))}
                </View>
                <View style={styles.UnavailableMeals_Section}>
                  <Text style={styles.SuggestedMeals_Text}>Missing ingredients</Text>
                  {filteredData
                    .filter((recipe) => !checkMandatoryIngredientsAreAvailable(recipe.id))
                    .map((recipe) => (
                      <MealCard
                        navigation={navigation}
                        recipe={recipe}
                        key={recipe.id}
                        isAvailable={false}
                      />
                    ))}
                </View>
              </>
            ) : (<View />)}
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
    paddingBottom: 20,
  },
  SuggestedMeals_Text: {
    fontSize: SecondTitleFontSize + 2,
    fontWeight: SecondTitleFontWeight,
    fontFamily: MainFont_Bold,
    marginTop: 20,
  },
  MealList_Wrapper: {
    width: '100%',
    marginTop: -20,
  },
  AvailableMeals_Section: {
    marginBottom: 20,
  },
  UnavailableMeals_Section: {
    marginTop: 20,
  },
});
