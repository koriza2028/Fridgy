import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from 'react-native';

import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome6';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { MainFont, buttonColor, backgroundColor } from '../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import FridgePage from './pages/Fridge';
import CookingPage from './pages/Cooking';
import BasketPage from './pages/Basket';
import RecipeCreatePage from './pages/RecipeCreate';
import LoginPage from './pages/Login';
import AutoBasketPage from './pages/AutoBasket';

import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import 'react-native-gesture-handler'; 
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import useAuthStore from './store/authStore';



const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


const FridgeStack = () => (
  <Stack.Navigator >
    <Stack.Screen
      name="FridgePage"
      component={FridgePage}
      options={{
        headerShown: true,
        headerTitle: "Your fridge",
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
        headerTitle: 'Cooking space'
      }}
    />
    <Stack.Screen
        name="RecipeCreatePage"
        component={RecipeCreatePage}
        options={{ title: '', headerShown: false }}
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
        headerTitle: 'Basket to go shopping'
       }}
    />
    <Stack.Screen
        name="AutoBasketPage"
        component={AutoBasketPage}
        options={{ 
          headerShown: true,
          headerTitle: 'Fast basket'
         }}
      />
  </Stack.Navigator>
);


const App = () => {
  const user = useAuthStore((state) => state.user);

  if (user === null) {
    // User is not logged in, show the login page
    return (
      <NavigationContainer>
        <LoginPage />
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer >
      <View style={{backgroundColor: backgroundColor, flex: 1}}>
      <Tab.Navigator 
        initialRouteName="Fridge"
        // initialRouteName="Cooking"
        // initialRouteName="ReceiptCreatePage"

        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarLabelStyle: { fontFamily: MainFont, fontSize: 10 },
          tabBarIcon: ({ focused, color }) => {
            let iconName;
            let size = focused ? 30 : 24;

            if (route.name === 'Fridge') {
              iconName = 'fridge';
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            } else if (route.name === 'Cooking') {
              iconName = 'kitchen-set';
              return <FontAwesomeIcons name={iconName} size={size} color={color} />;
            } else if (route.name === 'Basket') {
              iconName = 'shopping-basket';
              return <MaterialIcons name={iconName} size={size} color={color} />;
            }
          },
          tabBarActiveTintColor: '#0056b3', // Active tab icon color
          tabBarInactiveTintColor: 'black', // Inactive tab icon color
          tabBarActiveBackgroundColor: buttonColor, // Active tab background color
          tabBarInactiveBackgroundColor: '#ffffff', // Inactive tab background color
          tabBarStyle: {
            borderTopWidth: 0,
            elevation: 0, 
            height: 50,
            borderTopRightRadius: 20,
            borderTopLeftRadius: 20,
            borderColor: 'white',
            // margin: 10, 
            overflow: 'hidden',
          },
        })}
      >
        <Tab.Screen
          name="Fridge"
          component={FridgeStack}
          options={{
            tabBarShowLabel: false,
          }}
        />
        <Tab.Screen
          name="Cooking"
          component={CookingStack}
          options={{
            tabBarShowLabel: false,
          }}
        />
        <Tab.Screen
          name="Basket"
          component={BasketStack}
          options={{
            tabBarShowLabel: false,
          }}
        />
      </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}

export default gestureHandlerRootHOC(App);