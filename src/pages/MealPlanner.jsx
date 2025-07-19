import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Alert, 
  Animated, TouchableWithoutFeedback, Keyboard, LayoutAnimation, FlatList, Image
 } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';

import AppImage from '../components/image/AppImage';

import CalendarModal from '../components/mealplanner.jsx/ModalCalendar.jsx';
import MealCard from '../components/cooking/MealCard.jsx';
import SearchInput from '../components/Search';
import AddNewButton from '../components/Button_AddNew.jsx';
import ButtonBouncing from '../components/Button_Bouncing.jsx';

import { useFonts } from 'expo-font';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { buttonColor, backgroundColor, addButtonColor, MainFont, TextFontSize, MainFont_Bold, SecondTitleFontSize, deleteButtonColor } from '../../assets/Styles/styleVariables';
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

  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });

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
    if (!ctx.userId) return;

    fetchEnrichedRecipes(ctx)
      .then(data => {
        setRecipeBook({ recipes: data });
        setFilteredData(data);
      })
      .catch(console.error);

    fetchAvailableProducts(ctx)
      .then(setFridgeProducts)
      .catch(console.error);
  }, [ctx.userId, ctx.familyId]);

  useFocusEffect(
    useCallback(() => {
      if (!ctx.userId) return;

      fetchEnrichedRecipes(ctx)
        .then(data => {
          setRecipeBook({ recipes: data });
          setFilteredData(data);
        })
        .catch(console.error);

      fetchAvailableProducts(ctx)
        .then(setFridgeProducts)
        .catch(console.error);
    }, [ctx.userId, ctx.familyId])
  );

  useEffect(() => {
    if (!ctx.userId) return;
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
          : fetchMealPlanForDate(ctx, date).then(({ recipes }) => ({
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
  }, [ctx.userId, selectedDate]);

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
      const updatedIds = await addRecipeToDate(ctx, selectedDate, recipeId);
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
      const updatedIds = await removeRecipeFromDate(ctx, selectedDate, recipeId);
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

  // const handleSearch = (text) => {
  //   setSearchQuery(text);
  // };
  

  const cards = useMemo(
    () => recipeBook.recipes.filter(r => plannedRecipeIds.includes(`${r.id}_${selectedDate}`)),
    [recipeBook, recipeBook.recipes, plannedRecipeIds, selectedDate]
  );

  const renderItem = useCallback(
    ({ item }) => (
      // <View style={styles.rowFront}>
        <MealCard
          recipe={item}
          isAvailable
          isMealPlanner
          // onLongPress={() => handleRemoveRecipe(`${item.id}_${selectedDate}`)}
        />
      // </View>
    ),
    [handleRemoveRecipe, selectedDate]
  );

  const renderHiddenItem = useCallback(
    ({ item }) => (
      <View style={styles.rowBack}>
        <Pressable onPress={() => handleRemoveRecipe(`${item.id}_${selectedDate}`)}>
          <Entypo name="trash" size={28} style={styles.deleteText}/>
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

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const recipes = recipeBook.recipes;
      const results = recipes.filter(recipe =>
        !plannedRecipeIds.includes(`${recipe.id}_${selectedDate}`) &&
        recipe.title.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(results);
    } else {
      const base = recipeBook.recipes.filter(
        recipe => !plannedRecipeIds.includes(`${recipe.id}_${selectedDate}`)
      );
      setFilteredData(base);
    }
  };

  const listHeader = (
  <View style={styles.navigation}>
    <ButtonBouncing onPress={() => changeDate(-1)} style={styles.ButtonArrows}
      label={<Entypo name="arrow-long-left" size={30} />}/>
    <Text style={styles.TextDate}>{formatDateDisplay(selectedDate)}</Text>
    <ButtonBouncing onPress={() => changeDate(1)} style={styles.ButtonArrows}
      label={<Entypo name="arrow-long-right" size={30} />}/>
  </View>
);

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
    <View style={styles.MealPlannerPage}>
      <View style={styles.MealPlannerPage_ContentWrapper}>

        <SearchInput placeholder="Find a product" query={searchQuery} onChangeText={handleSearch} />

        {/* <View style={styles.navigation}>

          <ButtonBouncing onPress={() => changeDate(-1)} style={styles.ButtonArrows}
            label={<Entypo name="arrow-long-left" size={30} />}/>

          <Text style={styles.TextDate}>{formatDateDisplay(selectedDate)}</Text>

          <ButtonBouncing onPress={() => changeDate(1)} style={styles.ButtonArrows}
            label={<Entypo name="arrow-long-right" size={30} />}/>

        </View> */}
        
        
          {searchQuery.length > 0 ? (
            <FlatList
              data={[...filteredData]}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="always"
              renderItem={({ item }) => {
                return (
                  <Pressable style={{marginVertical: 6, paddingHorizontal: 10}}> 
                    <MealCard
                      recipe={item}
                      isAvailable={true}
                      isMealPlanner={true}
                      handlePress={() => handleAddRecipe(item.id)}
                    />
                  </Pressable>
                );
              }}
            />
        ) : (
        cards.length > 0 ? (
            
          <SwipeListView
            ListHeaderComponent={listHeader}
            stickyHeaderIndices={[0]}
            data={cards}
            keyExtractor={(item) => `${item.id}_${selectedDate}`}
            key={listKey}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-75}
            disableRightSwipe={false}
            disableScrollOnSwipe
            contentContainerStyle={{ flexGrow: 1, gap: 14, paddingHorizontal: 10,  }}
            recalculateHiddenLayout
            closeOnRowOpen={false}
            closeOnScroll={false}
            closeOnRowPress={false}
            getItemLayout={(_, index) => ({
              length: 120,
              offset: 120 * index,
              index,
            })}
          />
          ) : (
          <View style={{ alignItems: 'center', position: 'absolute', width: width, top: height*0.3, paddingLeft: 10,}}>
            <Image
              source={require('../../assets/ProductImages/emptyPlanner.png')}
              style={{ width: 184, height: 184, resizeMode: 'contain' }}
            />
            <Text style={{ fontFamily: MainFont, marginTop: 10 }}>What do you want to cook this week?</Text>
          </View>
        )
        )}
      </View>

    {/* calendar-month */}
      <AddNewButton creativeAction={() => setIsCalendarVisible(v => !v)} 
        label={<MaterialIcons name={'calendar-month'} size={30} />}
        />

      <CalendarModal
        isVisible={isCalendarVisible}
        onClose={() => setIsCalendarVisible(false)}
        onDaySelect={date => setSelectedDate(date)}
        selectedDate={selectedDate}
      />

    </View>

    </TouchableWithoutFeedback>
  );

}

const styles = StyleSheet.create({
  MealPlannerPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    alignItems: 'center',
  },
  MealPlannerPage_ContentWrapper: {
    width: width,
    // height: height,
    // paddingHorizontal: 10,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 30,
    alignItems: 'center',
    // paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  addMore_Button: {
    // marginVertical: 20,
    position: 'static',
    borderWidth: 0,
    shadowColor: 'transparent',
    backgroundColor: 'transparent',
    width: 'auto',
  },
  addMore_Button_Text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: addButtonColor,
  },
  addMore_innerStyle: {
    // borderWidth: 0,
  },
  ButtonArrows: {
    padding: 10,
    width: 50,
    height: 50,
    borderRadius: 30,
    marginTop: 10,
  },
  TextDate: {
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize + 2,
    paddingTop: 10,
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
    top: "15%", 
    bottom: 0, 
    right: 0,
    width: 75,
    height: width / 6,
    borderRadius: 8,
    // marginTop: 20,
    // backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: deleteButtonColor,
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

  searchItem_Image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  searchItem_Text: {
    fontSize: SecondTitleFontSize,
    fontFamily: MainFont,
  },
  ItemCategoryHint: {
    paddingTop: 10,
    fontSize: 12,
    fontFamily: MainFont,
  },
});
