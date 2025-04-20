import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CalendarModal from '../components/mealplanner.jsx/ModalCalendar.jsx';
import MealCard from '../components/cooking/MealCard.jsx';
import SearchModal from "../components/SearchModal";
import { useFonts } from 'expo-font';
import { buttonColor, backgroundColor, addButtonColor } from '../../assets/Styles/styleVariables';
import useAuthStore from '../store/authStore';
import { fetchEnrichedRecipes } from '../store/cookingStore';
import { fetchAvailableProducts } from '../store/fridgeStore';
import {
  fetchMealPlanForDate,
  addRecipeToDate,
  removeRecipeFromDate
} from '../store/mealPlannerStore';

const { width, height } = Dimensions.get('window');

export default function MealPlannerPage({ navigation }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const userId = useAuthStore((state) => state.user?.uid);
  const [recipeBook, setRecipeBook] = useState({ recipes: [] });
  const [fridgeProducts, setFridgeProducts] = useState([]);

  // Meal plan state for the selected date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedRecipeIds, setPlannedRecipeIds] = useState([]);

  // Search modal state
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const modalSearchRef = useRef();

  // Calendar modal state
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  // Load recipes and fridge on focus
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchEnrichedRecipes(userId)
          .then(data => {
            setRecipeBook({ recipes: data });
            setFilteredData(data); // initial full list
          })
          .catch(console.error);
        fetchAvailableProducts(userId)
          .then(setFridgeProducts)
          .catch(console.error);
      }
    }, [userId])
  );

  // Load meal plan for current date
  useEffect(() => {
    if (!userId) return;
    fetchMealPlanForDate(userId, selectedDate)
      .then(({ recipes }) => setPlannedRecipeIds(recipes.map(r => r.id)))
      .catch(console.error);
  }, [userId, selectedDate]);

  // Update filtered list for search modal whenever searchQuery or recipes change
  useEffect(() => {
    const base = recipeBook.recipes.filter(r => !plannedRecipeIds.includes(r.id));
    if (searchQuery.trim()) {
      setFilteredData(
        base.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredData(base);
    }
  }, [searchQuery, recipeBook.recipes, plannedRecipeIds]);

  // Helpers
  const changeDate = (offsetDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    setSearchQuery('');
    modalSearchRef.current?.reset();
  };

  const formatDateDisplay = (isoDate) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}`;
  };

  const handleAddRecipe = async (recipeId) => {
    try {
      const updatedIds = await addRecipeToDate(userId, selectedDate, recipeId);
      setPlannedRecipeIds(updatedIds);
      setIsSearchModalVisible(false);
      setSearchQuery('');
      modalSearchRef.current?.reset();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add recipe');
    }
  };

  const handleRemoveRecipe = async (recipeId) => {
    try {
      const updatedIds = await removeRecipeFromDate(userId, selectedDate, recipeId);
      setPlannedRecipeIds(updatedIds);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not remove recipe');
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  return (
    <View style={styles.MealPlannerPage}>
      <View style={styles.MealPlannerPage_ContentWrapper}>

        <View style={styles.navigation}>
          <Pressable onPress={() => changeDate(-1)}>
            <Text>Prev</Text>
          </Pressable>
          <Text>{formatDateDisplay(selectedDate)}</Text>
          <Pressable onPress={() => changeDate(1)}>
            <Text>Next</Text>
          </Pressable>
        </View>

        <View style={styles.dailyContent}>
          {recipeBook.recipes
            .filter(r => plannedRecipeIds.includes(r.id))
            .map(recipe => (
              <MealCard
                key={recipe.id}
                recipe={recipe}
                isAvailable={true}
                onLongPress={() => handleRemoveRecipe(recipe.id)}
              />
            ))}
          <Pressable style={styles.addMore_Button} onPress={() => setIsSearchModalVisible(true)}>
            <Text style={styles.addMore_Button_Text}>Add more +</Text>
          </Pressable>
        </View>

        <View style={styles.missingIngredients}>
          <Text>List of required ingredients {formatDateDisplay(selectedDate)}</Text>
        </View>

      </View>

      <Pressable
        style={styles.openCalendar_Button}
        onPress={() => setIsCalendarVisible(prev => !prev)}
      >
        <Text>C</Text>
      </Pressable>

      <CalendarModal
        isVisible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onDaySelect={(date) => setSelectedDate(date)}
        selectedDate={selectedDate}
      />

      <SearchModal
        ref={modalSearchRef}
        isSearchModalVisible={isSearchModalVisible}
        closeSearchModal={() => setIsSearchModalVisible(false)}
        handleSearch={handleSearch}
        searchQuery={searchQuery}
        filteredData={filteredData}
        isRecipeCreate={false}
        addProduct={handleAddRecipe}
        isMealPlanner={true}
      />

    </View>
  );
}

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
    paddingHorizontal: 10,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dailyContent: {
    minHeight: width / 4,
    width: '100%',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
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
    position: 'absolute',
    bottom: 20,
    right: 10,
    width: 50,
    height: 50,
    padding: 15,
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
});
