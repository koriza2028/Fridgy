import React from "react";
import { StyleSheet, TextInput, View, Pressable } from "react-native";
import Entypo from 'react-native-vector-icons/Entypo';

import { greyTextColor, greyTextColor2, MainFont } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function SearchInput({ placeholder, query, onChangeText }) {

     const [fontsLoaded] = useFonts({
        'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      });

    return (         
        // <TextInput style={styles.searchInput} placeholder={placeholder} value={query} 
        // onChangeText={(text) => onChangeText(text)} placeholderTextColor={'#9e9e9e'} ></TextInput>

        <View style={styles.container}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={query}
            onChangeText={onChangeText}
            placeholderTextColor={'#9e9e9e'}
          />
          {query.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => onChangeText('')}>
              <Entypo name="cross" size={28} color={greyTextColor} />
            </Pressable>
          )}
        </View>
    )}

const styles = StyleSheet.create({
    container: {
      position: "relative",
      width: '100%',
      alignSelf: 'center',
    },
    searchInput: {
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        width: '96%',
        height: 40,
        alignSelf: 'center',
        padding: 8,
        paddingHorizontal: 14,
        marginBottom: 10,
        marginTop: 10,
        fontFamily: MainFont,

        shadowColor: "darkgrey", 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
        elevation: 2, 
      },
      clearButton: {
        position: "absolute",
        right: 10,
        top: 12,
        padding: 4,
      },
})