import React, {useState, useCallback, useEffect} from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
// import { Calendar } from 'react-native-calendars';
import CalendarModal from '../components/mealplanner.jsx/ModalCalendar.jsx';


import MealCard from '../components/cooking/MealCard.jsx';
import SearchModal from "../components/SearchModal";

import { useFonts } from 'expo-font';
import { buttonColor, backgroundColor, addButtonColor } from '../../assets/Styles/styleVariables';

import useAuthStore from '../store/authStore';
import { fetchEnrichedRecipes } from '../store/cookingStore';
import { fetchAvailableProducts } from '../store/fridgeStore';

const { width, height } = Dimensions.get('window');

export default function MealPlannerPage({navigation}) {
    const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    const userId = useAuthStore((state) => state.user?.uid);
    const [recipeBook, setRecipeBook] = useState({ recipes: [] });
    const [filteredData, setFilteredData] = useState([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [fridgeProducts, setFridgeProducts] = useState([]);

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

    const checkIngredientIsAvailable = (ingredient) => {
        const key = ingredient.productId || ingredient.id;
        return fridgeProducts.some(product => product.id === key);
      };

    const checkMandatoryIngredientsAreAvailable = (recipeId) => {
        const recipe = recipeBook.recipes.find(recipe => recipe.id === recipeId);
        if (!recipe || !recipe.mandatoryIngredients) return false;
        for (const ingredient of recipe.mandatoryIngredients) {
          // Use productId if present.
          if (!checkIngredientIsAvailable(ingredient)) return false;
        }
        return true;
      };

    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const openSearchModal = () => setIsSearchModalVisible(true);
    const closeSearchModal = () => setIsSearchModalVisible(false);

    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
      );

    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        return `${day}.${month}`;
      };

    //   DO WE WANT TO ADD TIME FRAME WHEN TO EAT IT? OR MAYBE A TAG LIKE LUNCH / DINNER, ETC?
    return (
        <View style={styles.MealPlannerPage}>
            <View style={styles.MealPlannerPage_ContentWrapper}>

                <View style={styles.navigation}>
                    <Pressable><Text>Left</Text></Pressable>
                    <Pressable><Text>Right</Text></Pressable>
                </View>

                <View style={styles.dailyContent}>
                    {filteredData
                        .filter((recipe) => checkMandatoryIngredientsAreAvailable(recipe.id))
                        .map((recipe) => (
                            <MealCard
                                // navigation={navigation}
                                // instead of opening page, we'll open info widget 
                                recipe={recipe}
                                key={recipe.id}
                                // how to define the availability here? They all must be mixed
                                isAvailable={true}
                            />
                    ))}
                    <Pressable style={styles.addMore_Button} onPress={openSearchModal}>
                        <Text style={styles.addMore_Button_Text}>Add more +</Text>
                    </Pressable>
                </View>

                <View style={styles.missingIngredients}>
                    <Text>List of required ingredients {formatDate(selectedDate)}</Text>
                </View>

            </View>

            <Pressable style={styles.openCalendar_Button} onPress={() => setIsCalendarVisible((prev) => !prev)}>
                <Text>C</Text>
            </Pressable>

            <CalendarModal
                isVisible={isCalendarVisible}
                onClose={() => setIsCalendarVisible(false)}
                    onDaySelect={(date) => {
                    setSelectedDate(date);
                }}
                selectedDate={selectedDate}
            />

            <SearchModal
                isSearchModalVisible={isSearchModalVisible}
                closeSearchModal={closeSearchModal}
                // handleSearch={handleSearchInput}
                filteredData={filteredData}
                isRecipeCreate={false}
                isMealPlanner={true}
                // addProduct={addIngredient}
                // isMandatory={isMandatoryFlag}
                modalSearchRef={null}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    MealPlannerPage: {
        flex: 1,
        backgroundColor: backgroundColor,
        width: width,
        alignItems: 'center',
    },
    MealPlannerPage_ContentWrapper: {
        width: width,
        height: height,
        // justifyContent: 'center',
        // alignItems: 'center',
        paddingHorizontal: 10,
        // backgroundColor: '#fff',
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        // height: height * 0.05,
        height: 30,
        alignItems: 'center',
        paddingHorizontal: 10,
        
        // borderWidth: 1,
        // borderColor: '#000',
    },
    dailyContent: {
        // height: height * 0.75,
        minHeight: width / 4,
        width: '100%',
        justifyContent: 'center',
        marginTop: 20,
        paddingHorizontal: 10,
        // backgroundColor: 'green',
        borderWidth: 2,
        borderRadius: 8,
        borderColor: '#000',
    },
    addMore_Button: {
        marginVertical: 20,
    },
    addMore_Button_Text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: addButtonColor,
    },
    missingIngredients: {
        marginTop: 20,
        paddingHorizontal: 4,
    },

    openCalendar_Button: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
        // paddingBottom: 100,
    
        position: 'absolute',
        bottom: 20,
        right: 10,
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
    //   calendar: {
    //     position: 'absolute',
    //     top: 20,
    //     left: 10,
    //     zIndex: 100,
    //   }

});

