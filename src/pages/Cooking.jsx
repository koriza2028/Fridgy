import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Text, View, Pressable, ScrollView, RefreshControl, StyleSheet, Dimensions, Image } from 'react-native';

import MealCard from '../components/cooking/MealCard';
import SearchInput from '../components/Search';
import FiltersRecipeCategory from '../components/cooking/FiltersRecipeCategory';
import AddNewButton from '../components/Button_AddNew';
// import CookbookCard from '../components/cooking/CookbookCard';

import { buttonColor, backgroundColor, MainFont, MainFont_Bold, SecondTitleFontSize, SecondTitleFontWeight, addButtonColor } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import { tags } from '../../assets/Variables/categories';
import useAuthStore from '../store/authStore';
import { fetchEnrichedRecipes } from '../store/cookingStore';
import { fetchAvailableProducts } from '../store/fridgeStore';

const { width, height } = Dimensions.get('window');

export default function CookingPage({ navigation }) {

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
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
  // const [refreshing, setRefreshing] = useState(false);

  // Fetch enriched recipes and available fridge products.
  useFocusEffect(
    useCallback(() => {
      if (ctx) {
        fetchEnrichedRecipes(ctx)
          .then(enrichedData => {
            setRecipeBook({ recipes: enrichedData });
            setFilteredData(enrichedData || []);
          })
          .catch(error => {
            console.error("Failed to fetch recipes", error);
          });
        fetchAvailableProducts(ctx)
          .then(products => {
            setFridgeProducts(products);
          })
          .catch(error => {
            console.error("Failed to fetch available products", error);
          });
      }
    }, [ctx.userId, ctx.familyId])
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

  // const onRefresh = useCallback(() => {
  //   setRefreshing(true);
  //   if (ctx) {
  //     fetchEnrichedRecipes(ctx)
  //       .then(enrichedData => {
  //         setRecipeBook({ recipes: enrichedData });
  //         setFilteredData(enrichedData || []);
  //         setRefreshing(false);
  //       })
  //       .catch(error => {
  //         console.error("Failed to refresh recipes", error);
  //         setRefreshing(false);
  //       });
  //   }
  // }, [ctx.userId, ctx.familyId]);

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
      {/* <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}> */}
      <ScrollView>
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
            {/* Show empty state if there's nothing and no search */}
            {filteredData.length === 0 && searchQuery === '' ? (
              <View style={{ alignItems: 'center', position: 'absolute', width: width, top: height*0.17, paddingRight: 10,}}>
                <Image
                  source={require('../../assets/ProductImages/emptyBook.png')}
                  style={{ width: 184, height: 184, resizeMode: 'contain' }}
                />
                <Text style={{ fontFamily: MainFont, marginTop: 10 }}>You don't have recipes yet. But let's create some!</Text>
              </View>
            ) : (
              <>
                {/* Available meals section */}
                {filteredData.some(recipe => checkMandatoryIngredientsAreAvailable(recipe.id)) && (
                  <>
                    <Text style={styles.SuggestedMeals_Text}>Available meals</Text>
                    <View style={styles.AvailableMeals_Section}>
                      {filteredData
                        .filter(recipe => checkMandatoryIngredientsAreAvailable(recipe.id))
                        .map(recipe => (
                          <MealCard
                            key={recipe.id}
                            navigation={navigation}
                            recipe={recipe}
                            isAvailable={true}
                            handlePress={() =>
                              navigation.navigate('RecipeCreatePage', { recipe })
                            }
                          />
                        ))}
                    </View>
                  </>
                )}

                {filteredData.some(recipe => !checkMandatoryIngredientsAreAvailable(recipe.id)) && (
                  <>
                    <Text style={styles.SuggestedMeals_Text}>Missing ingredients</Text>
                    <View style={styles.UnavailableMeals_Section}>
                      {filteredData
                        .filter(recipe => !checkMandatoryIngredientsAreAvailable(recipe.id))
                        .map(recipe => (
                          <MealCard
                            key={recipe.id}
                            navigation={navigation}
                            recipe={recipe}
                            isAvailable={false}
                            handlePress={() =>
                              navigation.navigate('RecipeCreatePage', { recipe })
                            }
                          />
                        ))}
                    </View>
                  </>
                )} 

              </>
            )}
          </View>



        </View>
      </ScrollView>
      <AddNewButton creativeAction={() => navigation.navigate('RecipeCreatePage')} label={'+'} />
        
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
    width: width,
    paddingBottom: 20,
  },
  SuggestedMeals_Text: {
    fontSize: SecondTitleFontSize + 2,
    fontWeight: SecondTitleFontWeight,
    fontFamily: MainFont_Bold,
    marginVertical: 14,
  },
  MealList_Wrapper: {
    // width: '100%',
    marginTop: -20,
    marginHorizontal: 10,
  },
  AvailableMeals_Section: {
    marginBottom: 0,
    gap: 14,
  },
  UnavailableMeals_Section: {
    // marginTop: 20,
    gap: 14,
  },
});
