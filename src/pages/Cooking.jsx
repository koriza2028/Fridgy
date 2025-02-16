import React, {useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Keyboard, Text, View, TouchableOpacity, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback,
        Platform, StyleSheet, Dimensions, RefreshControl } from 'react-native';


// import MealCard from '../PageSpecificComponents/CookingComponents/MealCard';
// import SearchInput from '../GeneralComponents/Search';
// import FiltersRecipeCategory from '../PageSpecificComponents/CookingComponents/FiltersRecipeCategory';

// import { ServiceFactory } from "../../services/ServiceFactory";

import { buttonColor, backgroundColor, MainFont, MainFont_Bold, SecondTitleFontSize, SecondTitleFontWeight, addButtonColor } from '../../assets/Styles/styleVariables';
// import { useFonts } from 'expo-font';

// import { tags } from '../../assets/Variables/categories';
// import AddNewButton from '../GeneralComponents/Button_AddNew';

const { width } = Dimensions.get('window');

export default function CookingPage({ navigation }) {

//   const [fontsLoaded] = useFonts({
//           'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
//           'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
//   });

//   const recipeBookService = ServiceFactory.createRecipeBookService();

//   const [recipeBook, setRecipeBook] = useState(null);

//   const [searchQuery, setSearchQuery] = useState("");
//   const [filteredData, setFilteredData] = useState([]);
//   const [debouncedQuery, setDebouncedQuery] = useState("");

//   useFocusEffect(
//       React.useCallback(() => {
//           recipeBookService
//               .fetchRecipeBook("recipeBookId")
//               .then(recipeBook => {
//                   setRecipeBook(recipeBook);
//                   setFilteredData(recipeBook.recipes || []); // Update filtered data initially
//               })
//               .catch(error => {
//                   console.error("Failed to fetch recipeBook", error);
//               });
//       }, [])
//   );

//   // Debounce search input for better performance
//   useEffect(() => {
//       const handler = setTimeout(() => {
//           setDebouncedQuery(searchQuery);
//       }, 300);

//       return () => clearTimeout(handler);
//   }, [searchQuery]);

//   // Filter results when debounced query updates
//   useEffect(() => {
//       if (!recipeBook || !recipeBook.recipes) return;

//       if (!debouncedQuery.trim()) {
//           setFilteredData(recipeBook.recipes); // Reset if search is empty
//           return;
//       }

//       const results = recipeBook.recipes.filter(recipe =>
//             recipe.title.toLowerCase().includes(debouncedQuery.toLowerCase())
//       );

//       setFilteredData(results);
//   }, [debouncedQuery, recipeBook]);

//   // Handle search input
//   const handleSearch = (text) => {
//       setSearchQuery(text);
//   };

//   const removeRecipe = async (recipeId) => {
//     const updatedRecipeBook = await recipeBookService.deleteRecipe(recipeId);
//     const results = updatedRecipeBook.recipes.filter(recipe =>
//         recipe.title.toLowerCase().includes(debouncedQuery.toLowerCase())
//     );

//     setFilteredData(results);
//   };


//   // NEED TO TEST IF IT WORKS
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate a network request or any asynchronous operation.
    setTimeout(() => {
      setRefreshing(false);
      // You can also call any function to reload your data here.
    }, 2000);
  }, []);

  return (
      <View style={styles.CookingPage}>

          <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }>
              
              <View style={styles.CookingPage_ContentWrapper}>

                  {/* <SearchInput placeholder={'Find a recipe'} query={searchQuery} onChangeText={handleSearch}></SearchInput> */}
                  {/* The given variable must be not a searchQuery */}

                  {/* <FiltersRecipeCategory filterRules={tags}></FiltersRecipeCategory>

                  <Text style={styles.SuggestedMeals_Text}>Suggested meals:</Text>

                  <View style={styles.MealList_Wrapper}>
                      {filteredData.length > 0 || searchQuery !== "" ? (
                          filteredData.map((recipe) => (
                              <MealCard navigation={navigation} recipe={recipe} key={recipe._id} onRemove={removeRecipe}/>
                          ))
                      ) : (
                          <View/>
                      )}
                  </View> */}

              </View>
              
          </ScrollView>

          {/* <AddNewButton creativeAction={() => navigation.navigate('RecipeCreatePage')}></AddNewButton> */}

      </View>
  )}




const styles = StyleSheet.create({

    CookingPage: {
        flex: 1,
        backgroundColor: backgroundColor,
        alignItems: 'center',
        width: width,
      },
  
      CookingPage_ContentWrapper: {
        // marginTop: 30,
        // paddingHorizontal: 16,
        width: width * 0.96,
        // height: height,
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
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
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
      },

})