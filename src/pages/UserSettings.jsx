import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import ButtonGoBack from '../components/ButtonGoBack';

const UserSettingsPage = ({ navigation }) => {

  return (
    <View style={styles.UserSettingsPage}>
      <Text style={styles.title}>User Page</Text>

      <ButtonGoBack navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  UserSettingsPage: {
    flex: 1,
    justifyContent: 'center',
    // padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default UserSettingsPage;
