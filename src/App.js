// App.js
import '../src/store/i18n';
import React, { useEffect } from "react";
import { View, Alert, StyleSheet, Text } from 'react-native';

import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

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
import FamilyModePage from './pages/FamilyMode';
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
import { initAuthStore } from './store/initAuthStore';

import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { acceptInvite } from './store/inviteStore';

Purchases.configure({
  apiKey: Platform.select({
    ios: 'appl_DRjPbwCMfRjHzVNpvVFmyNQtMgA',
  }),
});

const linking = {
  prefixes: ['fridgy://'],
  config: {
    screens: {
      Invite: {
        path: 'invite',
        parse: {
          code: (code) => `${code}`,
        },
      },
      Fridge: 'fridge',
      Cooking: 'cooking',
      Basket: 'basket',
      MealPlanner: 'mealplanner',
    },
  },
};

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
        title: 'Premium Features',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />

    <Stack.Screen
      name="FamilyModePage"
      component={FamilyModePage}
      options={{
        title: 'Family Mode',
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
        title: 'Premium Features',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="FamilyModePage"
      component={FamilyModePage}
      options={{
        title: 'Family Mode',
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
        title: 'Premium Features',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="FamilyModePage"
      component={FamilyModePage}
      options={{
        title: 'Family Mode',
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
        title: 'Premium Features',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="FamilyModePage"
      component={FamilyModePage}
      options={{
        title: 'Family Mode',
        headerShown: true,
        detachPreviousScreen: false,
        gestureEnabled: false,
      }}
    />
  </Stack.Navigator>
);

const App = () => {
  useEffect(() => {
    initAuthStore(); // Initialize Firebase auth listener
  }, []);

  const user = useAuthStore((state) => state.user);
  const refreshProducts = useProductStore((state) => state.refreshProducts);

  // Refresh fridge products on login
  useEffect(() => {
    if (user?.uid) {
      refreshProducts(user.uid);
    }
  }, [user]);

  const PENDING_INVITE_KEY = 'pendingInviteCode';

  // Unified invite capture: works for cold and warm starts
  useEffect(() => {
    const handleUrl = async ({ url }) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      if ((parsed.path === 'invite' || parsed.hostname === 'invite') && parsed.queryParams?.code) {
        await AsyncStorage.setItem(PENDING_INVITE_KEY, parsed.queryParams.code);

        // ✅ If user is already logged in, process the invite right away
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.uid) {
          handleInvite(currentUser.uid); // <-- call this here
        }
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);

  const handleInvite = async (uid) => {
    try {
      const code = await AsyncStorage.getItem(PENDING_INVITE_KEY);
      if (!code) return;

      const currentFamilyId = useAuthStore.getState().familyId;

      if (currentFamilyId) {
        // 🚫 Already in a family — prevent joining another
        Alert.alert("Already in a Family", "You are already a member of a family and cannot join a new one.");
        await AsyncStorage.removeItem(PENDING_INVITE_KEY);
        return;
      }

      const newFamilyId = await acceptInvite({ userId: uid }, code);

      useAuthStore.getState().setFamilyId(newFamilyId);
      useAuthStore.getState().setLastUsedMode("family");
      await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    } catch (err) {
      console.error("Invite accept failed", err);
      Alert.alert("Invite Error", err.message);
    }
  };

  // Consume invite code after login
  useEffect(() => {
    if (!user?.uid) return;
    handleInvite(user.uid);
  }, [user?.uid]);

  if (user === undefined) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading user data...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Wenn user null ist, bist du ausgeloggt — zeige Login
  if (user === null) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <NavigationContainer linking={linking}>
          <LoginPage />
        </NavigationContainer>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer linking={linking}>
        <View style={{ backgroundColor: backgroundColor, flex: 1 }}>
          <Tab.Navigator
            initialRouteName="Fridge"
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarLabelStyle: { fontFamily: MainFont, fontSize: 10 },
              tabBarIcon: ({ focused, color }) => {
                const size = focused ? 28 : 24;
                if (route.name === 'Fridge')
                  return <MaterialCommunityIcons name="fridge" size={size} color={color} />;
                if (route.name === 'Cooking')
                  return <FontAwesomeIcons name="kitchen-set" size={size} color={color} />;
                if (route.name === 'Basket')
                  return <MaterialIcons name="shopping-basket" size={size} color={color} />;
                if (route.name === 'MealPlanner')
                  return <MaterialIcons name="restaurant" size={size} color={color} />;
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
