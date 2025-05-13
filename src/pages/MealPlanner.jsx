import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Alert, 
  Animated, TouchableWithoutFeedback, Keyboard, LayoutAnimation
 } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';

import CalendarModal from '../components/mealplanner.jsx/ModalCalendar.jsx';
import MealCard from '../components/cooking/MealCard.jsx';
import SearchModal from "../components/SearchModal";
import IngredientItem from "../components/cooking/IngredientCard";

import { useFonts } from 'expo-font';
import Entypo from 'react-native-vector-icons/Entypo';
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

  const AnimatedSwipeListView = Animated.createAnimatedComponent(SwipeListView);
  const scrollY = useRef(new Animated.Value(0)).current;

  const userId = useAuthStore((state) => state.user?.uid);
  const [recipeBook, setRecipeBook] = useState({ recipes: [] });
  const [fridgeProducts, setFridgeProducts] = useState([]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedRecipeIds, setPlannedRecipeIds] = useState([]);
  const [mealPlanCache, setMealPlanCache] = useState({});

  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  useEffect(() => {
    if (!userId) return;

    fetchEnrichedRecipes(userId)
      .then(data => {
        setRecipeBook({ recipes: data });
        setFilteredData(data);
      })
      .catch(console.error);

    fetchAvailableProducts(userId)
      .then(setFridgeProducts)
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const startDate = new Date(selectedDate);
    const datesToFetch = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    Promise.all(
      datesToFetch.map(date =>
        mealPlanCache[date]
          ? Promise.resolve({ date, ids: mealPlanCache[date] })
          : fetchMealPlanForDate(userId, date).then(({ recipes }) => ({
              date,
              ids: recipes.map(r => `${r.id}_${date}`)
            }))
      )
    )
      .then(results => {
        const updatedCache = { ...mealPlanCache };
        results.forEach(({ date, ids }) => {
          updatedCache[date] = ids;
        });
        setMealPlanCache(updatedCache);
        setPlannedRecipeIds(updatedCache[selectedDate] || []);
      })
      .catch(console.error);
  }, [userId, selectedDate]);

  useEffect(() => {
    const base = recipeBook.recipes.filter(r => !plannedRecipeIds.some(id => id.startsWith(r.id)));
    if (searchQuery.trim()) {
      setFilteredData(
        base.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredData(base);
    }
  }, [searchQuery, recipeBook.recipes, plannedRecipeIds]);

  const changeDate = (offsetDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    const iso = d.toISOString().split('T')[0];
    setSelectedDate(iso);
    setSearchQuery('');
    if (mealPlanCache[iso]) {
      setPlannedRecipeIds(mealPlanCache[iso]);
    }
  };

  const formatDateDisplay = (isoDate) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}.${month}`;
  };

  const handleAddRecipe = async (recipeId) => {
    try {
      const updatedIds = await addRecipeToDate(userId, selectedDate, recipeId);
      const modified = updatedIds.map(id => `${id}_${selectedDate}`);
      setPlannedRecipeIds(modified);
      setMealPlanCache(prev => ({ ...prev, [selectedDate]: modified }));
      setIsSearchModalVisible(false);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not add recipe');
    }
  };

  const handleRemoveRecipe = async (recipeIdDateKey) => {
    const recipeId = recipeIdDateKey.split('_')[0];
    const prevIds = plannedRecipeIds;

    const newIds = plannedRecipeIds.filter(id => id !== recipeIdDateKey);
    setPlannedRecipeIds(newIds);
    setMealPlanCache(prev => ({ ...prev, [selectedDate]: newIds }));

    try {
      const updatedIds = await removeRecipeFromDate(userId, selectedDate, recipeId);
      const modified = updatedIds.map(id => `${id}_${selectedDate}`);
      setPlannedRecipeIds(modified);
      setMealPlanCache(prev => ({ ...prev, [selectedDate]: modified }));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not remove recipe');
      setPlannedRecipeIds(prevIds);
      setMealPlanCache(prev => ({ ...prev, [selectedDate]: prevIds }));
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const cards = useMemo(
    () => recipeBook.recipes.filter(r => plannedRecipeIds.includes(`${r.id}_${selectedDate}`)),
    [recipeBook.recipes, plannedRecipeIds, selectedDate]
  );

  const renderItem = useCallback(
    ({ item }) => (
      // <View style={styles.rowFront}>
        <MealCard
          recipe={item}
          isAvailable
          isMealPlanner
          onLongPress={() => handleRemoveRecipe(`${item.id}_${selectedDate}`)}
        />
      // </View>
    ),
    [handleRemoveRecipe, selectedDate]
  );

  const renderHiddenItem = useCallback(
    ({ item }) => (
      <View style={styles.rowBack}>
        <Pressable onPress={() => handleRemoveRecipe(`${item.id}_${selectedDate}`)}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    ),
    [handleRemoveRecipe, selectedDate]
  );

  const [listKey, setListKey] = useState(Date.now());
    useFocusEffect(
      useCallback(() => {
        setListKey(Date.now()); // force SwipeListView to remount
      }, [])
  );

  return (
    <View style={styles.MealPlannerPage}>
      <View style={styles.MealPlannerPage_ContentWrapper}>
        <View style={styles.navigation}>
          <Pressable onPress={() => changeDate(-1)}>
            <Entypo name="arrow-long-left" size={30} />
          </Pressable>
          <Text>{formatDateDisplay(selectedDate)}</Text>
          <Pressable onPress={() => changeDate(1)}>
            <Entypo name="arrow-long-right" size={30} />
          </Pressable>
        </View>

        <SwipeListView
          data={cards}
          keyExtractor={(item) => `${item.id}_${selectedDate}`}
          key={listKey}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-75}
          disableRightSwipe={false}
          disableScrollOnSwipe
          contentContainerStyle={{ flexGrow: 1 }}
          recalculateHiddenLayout
          closeOnRowOpen={false}
          closeOnScroll={false}
          closeOnRowPress={false}
          getItemLayout={(_, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
          ListFooterComponent={() => (
            <Pressable
              style={styles.addMore_Button}
              onPress={() => setIsSearchModalVisible(true)}
            >
              <Text style={styles.addMore_Button_Text}>Add more +</Text>
            </Pressable>
          )}
        />
      </View>

      <Pressable
        style={styles.openCalendar_Button}
        onPress={() => setIsCalendarVisible(v => !v)}
      >
        <Text>C</Text>
      </Pressable>

      <CalendarModal
        isVisible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onDaySelect={date => setSelectedDate(date)}
        selectedDate={selectedDate}
      />

      <SearchModal
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
   

  // return (
  //   <View style={styles.MealPlannerPage}>
  //     <View style={styles.MealPlannerPage_ContentWrapper}>

  //       <View style={styles.navigation}>
  //         <Pressable onPress={() => changeDate(-1)}>
  //           <Entypo name="arrow-long-left" size={30}/>
  //         </Pressable>
  //         <Text>{formatDateDisplay(selectedDate)}</Text>
  //         <Pressable onPress={() => changeDate(1)}>
  //           <Entypo name="arrow-long-right" size={30}/>
  //         </Pressable>
  //       </View>

  //       <View style={styles.dailyContent}>
  //         {recipeBook.recipes
  //           .filter(r => plannedRecipeIds.includes(r.id))
  //           .map(recipe => (
  //             <MealCard
  //               key={recipe.id}
  //               recipe={recipe}
  //               isAvailable={true}
  //               isMealPlanner={true}
  //               onLongPress={() => handleRemoveRecipe(recipe.id)}
  //             />
  //           ))}
  //         <Pressable style={styles.addMore_Button} onPress={() => setIsSearchModalVisible(true)}>
  //           <Text style={styles.addMore_Button_Text}>Add more +</Text>
  //         </Pressable>
  //       </View>

  //       <View style={styles.requiredIngredients}>
  //         <Text>List of required ingredients {formatDateDisplay(selectedDate)}</Text>
  //         {mergeMandatoryIngredients().map((ingredient, index) => (
  //           // <Text key={index}>{ingredient.name}</Text>
  //           <IngredientItem 
  //               key={index}
  //               ingredient={ingredient}
  //               isAvailable={checkIngredientIsAvailable(ingredient.productId)}
  //               />
  //         ))}
  //       </View>

  //     </View>

  //     <Pressable
  //       style={styles.openCalendar_Button}
  //       onPress={() => setIsCalendarVisible(prev => !prev)}
  //     >
  //       <Text>C</Text>
  //     </Pressable>

  //     <CalendarModal
  //       isVisible={isCalendarVisible}
  //       onClose={() => setIsCalendarVisible(false)}
  //       onDaySelect={(date) => setSelectedDate(date)}
  //       selectedDate={selectedDate}
  //     />

  //     <SearchModal
  //       isSearchModalVisible={isSearchModalVisible}
  //       closeSearchModal={() => setIsSearchModalVisible(false)}
  //       handleSearch={handleSearch}
  //       searchQuery={searchQuery}
  //       filteredData={filteredData}
  //       isRecipeCreate={false}
  //       addProduct={handleAddRecipe}
  //       isMealPlanner={true}
  //     />

  //   </View>
  // );

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
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 30,
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dailyContent: {
    minHeight: width / 4,
    width: '100%',
    justifyContent: 'center',
    marginTop: 20,

    // paddingHorizontal: 8,
    // borderWidth: 2,
    // borderRadius: 8,
    // borderColor: '#000',
  },
  addMore_Button: {
    marginVertical: 20,
  },
  addMore_Button_Text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: addButtonColor,
  },
  requiredIngredients: {
    marginTop: 20,
    paddingHorizontal: 4,
    // height: 300,
  },
  rowFront: {
    // backgroundColor: backgroundColor,
    backgroundColor: addButtonColor,
    borderRadius: 8,
    height: width / 4,
    // paddingBottom: 10,
    // marginVertical: 5,     
  },
  rowBack: {
    position: 'absolute',
    top: "30%", 
    bottom: 0, 
    right: 0,
    width: 75,
    height: width / 6,
    borderRadius: 8,
    // marginTop: 20,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  openCalendar_Button: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    position: 'absolute',
    bottom: 20,
    right: 20,
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
