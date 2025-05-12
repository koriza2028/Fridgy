import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ButtonGoBack from '../components/ButtonGoBack';
import UserSlots from '../components/usersettings/UserSlots';

import { backgroundColor } from '../../assets/Styles/styleVariables';

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
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>

          <Text>You wanna change your name?</Text>

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
            <Pressable onPress={handleIconPress} style={styles.iconButton}>
              <MaterialIcons
                name={isEditable ? 'check' : 'edit'}
                size={24}
                color="black"
              />
            </Pressable>
          </View>

          <Text>Invite your whole family!</Text>
          <UserSlots />

        </View>
      </ScrollView>
      <ButtonGoBack navigation={navigation} />
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
    paddingTop: 100,
  },
  userName_InputContainer: {
    flexDirection: 'row',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  userName_Input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 8,
  },
});

export default UserSettingsPage;
