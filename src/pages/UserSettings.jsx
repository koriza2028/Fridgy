import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import ButtonGoBack from '../components/ButtonGoBack';
import UserSlots from '../components/usersettings/UserSlots';

import { useFonts } from 'expo-font';
import { addButtonColor, backgroundColor, buttonColor, greyTextColor, greyTextColor2, MainFont, MainFont_Bold, SecondTitleFontSize, SecondTitleFontWeight, TextFontSize } from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

const UserSettingsPage = () => {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const [text, setText] = useState("John Doe"); // default value
  const [isEditable, setIsEditable] = useState(false);

  const handleIconPress = () => {
    if (isEditable) {
      // Save logic here (e.g., update to Firestore)
      console.log('Saved:', text);
    }
    setIsEditable(!isEditable);
  };

  return (
    <View style={styles.UserSettingsPage}>
      <ScrollView >
        <View style={styles.UserSettingsPage_ContentWrapper}>

          <Text style={[styles.SectionHeader]}>Features offered by premium:</Text>
          <Text style={styles.PremiumSubHeader}>Get all this for just 3.21/month or 24.6/year</Text>

          <View style={styles.PremiumFeature}>
            <FontAwesome6 name="people-pulling" size={14} style={styles.PremiumFeature_Icon}/>
            <Text style={styles.PremiumFeature_Text}>Share your content with other users</Text>
          </View>
          
          <UserSlots />

          <View style={styles.listOfPremiumFeatures}>

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="photo-camera" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Upload your own pictures</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <Entypo name="calendar" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Unlimited dates for Meal Planner</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="shopping-basket" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Unlimited Autobasket</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <Entypo name="infinity" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Access to the future premium features for the same price</Text>
            </View>

            <Text style={styles.explanationHint}>* Why cannot these features be free? (i)</Text>
            {/* Include a short explanation here about the costs of running the app, e.g. server costs, development time, etc. */}
            <Pressable style={styles.upgradeButton}>
              <FontAwesomeIcons name="long-arrow-up" style={[styles.PremiumFeature_Icon, styles.upgradeIcon]}/>
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              <FontAwesomeIcons name="long-arrow-up" style={[styles.PremiumFeature_Icon, styles.upgradeIcon]}/>
            </Pressable>
          </View>

        </View>
      </ScrollView>
      {/* <ButtonGoBack navigation={navigation} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  UserSettingsPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    alignItems: 'center',
    width: width,
  },
  UserSettingsPage_ContentWrapper: {
    width: width,
    paddingHorizontal: 10,
    paddingBottom: 20,
    // paddingTop: 100,
  },
  SectionHeader: {
    fontSize: SecondTitleFontSize + 2,
    fontWeight: SecondTitleFontWeight,
    marginTop: 10,
    fontFamily: MainFont_Bold
  },
  PremiumSubHeader: {
    fontSize: 14,
    fontFamily: MainFont,
    color: greyTextColor2,
  },
  listOfPremiumFeatures: {
    marginTop: 10,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  PremiumFeature_Icon: {
    marginRight: 10,
    fontSize: 16,
    color: addButtonColor,
  },
  PremiumFeature_Text: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize + 4,
    // color: "#1f2937",
  },
  explanationHint: {
    marginTop: 10,
    fontSize: TextFontSize,
    fontFamily: MainFont,
    color: greyTextColor2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: addButtonColor,
    height: 42,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  upgradeText: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_Bold,
    color: 'white',
  },
  upgradeIcon: {
    color: 'white',
    marginHorizontal: 10,
    fontSize: TextFontSize + 10,
  },
});

export default UserSettingsPage;
