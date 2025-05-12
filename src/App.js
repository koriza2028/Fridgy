import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';

import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { MainFont, buttonColor, backgroundColor } from '../assets/Styles/styleVariables';

import FridgePage from './pages/Fridge';
import CookingPage from './pages/Cooking';
import BasketPage from './pages/Basket';
import RecipeCreatePage from './pages/RecipeCreate';
import LoginPage from './pages/Login';
import UserSettingsPage from './pages/UserSettings';
import AutoBasketPage from './pages/AutoBasket';
import MealPlannerPage from "./pages/MealPlanner";
import TopNavigationButtons from "./components/TopNavigationButtons";

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import useAuthStore from './store/authStore';
import useProductStore from './store/productStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const FridgeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="FridgePage"
      component={FridgePage}
      options={{
        headerShown: true,
        headerTitle: "Fridge",
        headerStyle: {
          backgroundColor: backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerRight: () => <TopNavigationButtons />,
      }}
    />
    <Stack.Screen
      name="UserSettingsPage"
      component={UserSettingsPage}
      options={{
        title: 'User settings',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

const CookingStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="CookingPage"
      component={CookingPage}
      options={{
        headerShown: true,
        headerTitle: 'Cooking space',
        headerStyle: {
          backgroundColor: backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerRight: () => <TopNavigationButtons />,
      }}
    />
    <Stack.Screen
      name="RecipeCreatePage"
      component={RecipeCreatePage}
      options={{
        title: '',
        headerShown: false,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="UserSettingsPage"
      component={UserSettingsPage}
      options={{
        title: 'User settings',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

const MealPlannerStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MealPlannerPage"
      component={MealPlannerPage}
      options={{
        headerShown: true,
        headerTitle: "Meal Planning",
        headerStyle: {
          backgroundColor: backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerRight: () => <TopNavigationButtons />,
      }}
    />
    <Stack.Screen
      name="UserSettingsPage"
      component={UserSettingsPage}
      options={{
        title: 'User settings',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

const BasketStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="BasketPage"
      component={BasketPage}
      options={{
        headerShown: true,
        headerTitle: 'Basket to go shopping',
        headerStyle: {
          backgroundColor: backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerRight: () => <TopNavigationButtons />,
      }}
    />
    <Stack.Screen
      name="AutoBasketPage"
      component={AutoBasketPage}
      options={{
        headerShown: true,
        headerTitle: 'Fast basket',
      }}
    />
    <Stack.Screen
      name="UserSettingsPage"
      component={UserSettingsPage}
      options={{
        title: 'User settings',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

const App = () => {
  const user = useAuthStore((state) => state.user);
  const refreshProducts = useProductStore((state) => state.refreshProducts);

  useEffect(() => {
    if (user?.uid) {
      refreshProducts(user.uid);
    }
  }, [user]);

  if (user === null) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer>
          <LoginPage />
        </NavigationContainer>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <View style={{ backgroundColor: backgroundColor, flex: 1 }}>
          <Tab.Navigator
            initialRouteName="Fridge"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarLabelStyle: { fontFamily: MainFont, fontSize: 10 },
              tabBarIcon: ({ focused, color }) => {
                let iconName;
                let size = focused ? 28 : 24;
                if (route.name === 'Fridge') {
                  iconName = 'fridge';
                  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                } else if (route.name === 'Cooking') {
                  iconName = 'kitchen-set';
                  return <FontAwesomeIcons name={iconName} size={size} color={color} />;
                } else if (route.name === 'Basket') {
                  iconName = 'shopping-basket';
                  return <MaterialIcons name={iconName} size={size} color={color} />;
                } else if (route.name === 'MealPlanner') {
                  iconName = 'restaurant';
                  return <MaterialIcons name={iconName} size={size} color={color} />;
                }
              },
              tabBarActiveTintColor: '#0056b3',
              tabBarInactiveTintColor: 'black',
              tabBarActiveBackgroundColor: buttonColor,
              tabBarInactiveBackgroundColor: '#ffffff',
              tabBarStyle: {
                borderTopWidth: 0,
                elevation: 0,
                height: 82,
                borderTopRightRadius: 20,
                borderTopLeftRadius: 20,
                marginBottom: -14,
                overflow: 'hidden',
              },
            })}
          >
            <Tab.Screen name="Fridge" component={FridgeStack} options={{ tabBarShowLabel: false }} />
            <Tab.Screen name="Cooking" component={CookingStack} options={{ tabBarShowLabel: false }} />
            <Tab.Screen name="MealPlanner" component={MealPlannerStack} options={{ tabBarShowLabel: false }} />
            <Tab.Screen name="Basket" component={BasketStack} options={{ tabBarShowLabel: false }} />
          </Tab.Navigator>
        </View>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationContainer: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
});

export default App;
