import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome6';
import Entypo from 'react-native-vector-icons/Entypo';

import ButtonGoBack from '../components/ButtonGoBack';
import UserSlots from '../components/usersettings/UserSlots';

import { addButtonColor, backgroundColor, buttonColor } from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

const UserSettingsPage = ({ navigation }) => {
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

          {/* <Text style={styles.SectionHeader}>You wanna change your name?</Text>

          <View style={styles.userName_InputContainer}>
            <TextInput
              value={text}
              onChangeText={setText}
              editable={isEditable}
              style={[
                styles.userName_Input,
                { color: isEditable ? 'black' : 'grey' },
              ]}
            />
            <Pressable onPress={handleIconPress} style={styles.editButton}>
              <MaterialIcons
                name={isEditable ? 'check' : 'edit'}
                size={24}
                color="black"
              />
            </Pressable>
          </View> */}

          {/* <Text style={styles.SectionHeader}>Invite your whole family!</Text> */}
          <Text style={[styles.SectionHeader, styles.PremiumHeader]}>Features offered by premium:</Text>
          <Text style={styles.PremiumSubHeader}>Get all this for just 3.21/month or 24.6/year</Text>

          <View style={styles.PremiumFeature}>
            <FontAwesome6 name="people-pulling" size={14} style={styles.PremiumFeature_Icon}/>
            <Text style={styles.PremiumFeature_Text}>Share your content with other users</Text>
          </View>
          
          <UserSlots />

          <View style={styles.listOfPremiumFeatures}>
            {/* <Text style={[styles.SectionHeader, styles.PremiumHeader]}>Features offered by premium:</Text>
            <Text style={styles.PremiumSubHeader}>3.21/month or 24.6/year</Text> */}

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="photo-camera" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Upload your own pictures</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <FontAwesome6 name="people-pulling" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Share your content with other users</Text>
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
{/* 
            <Text>Why aren't these features free?</Text>
            Include a short explanation here about the costs of running the app, e.g. server costs, development time, etc. */}
            <Pressable style={styles.upgradeButton}>
              <MaterialIcons name="arrow-upward" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  // userName_InputContainer: {
  //   flexDirection: 'row',
  //   borderColor: '#ccc',
  //   borderWidth: 1,
  //   borderRadius: 8,
  //   alignItems: 'center',
  //   paddingHorizontal: 12,
  //   // paddingVertical: 4,
  // },
  // userName_Input: {
  //   flex: 1,
  //   fontSize: 16,
  //   // paddingVertical: 8,
  // },
  // editButton: {
  //   padding: 8,
  // },
  listOfPremiumFeatures: {
    marginTop: 20,
  },
  PremiumHeader: {
    marginVertical: 0,
    marginTop: 10,
  },
  PremiumSubHeader: {
    fontSize: 12,
    // marginBottom: 10,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  PremiumFeature_Icon: {
    marginRight: 8,
  },
  PremiumFeature_Text: {
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: buttonColor,
    height: 36,
    borderRadius: 8,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
});

export default UserSettingsPage;
