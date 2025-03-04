import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

import { MainFont, MainFont_Bold, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';


export default function BasketItem({ product, onRemove, onAdd, isChecked, onToggleCheckbox}) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    // REVIEW: ADD ONDECREMENT INSTEAD OF REMOVING
    const removeProduct = () => {
        onRemove(product.id);
    }

    const addProduct = () => {
        onAdd(product.id, product.amount);
    }


    const handleToggle = () => {
        onToggleCheckbox(product.id, !isChecked); // Inform parent of the toggle action
    };

    return (
        <View style={styles.BasketItem}>

            <TouchableOpacity style={styles.BasketItem_Checkbox} onPress={handleToggle}>
                <FontAwesomeIcons name={isChecked ? 'check-circle' : 'circle-o'} size={32}/>
            </TouchableOpacity >

            <View style={styles.BasketItem_Name}>
                <Text style={styles.BasketItem_Text}>{product.name}</Text>
            </View>

            <View style={styles.BasketItem_AmountAndButtons}>

                <TouchableOpacity style={styles.BasketItem_RemoveButton} onPress={removeProduct}>
                    <Text style={styles.BasketItem_Text}>-</Text>
                </TouchableOpacity>

                <Text style={styles.BasketItem_Text}>{product.amount}</Text>

                <TouchableOpacity style={styles.BasketItem_AddButton} onPress={addProduct}>
                    <Text style={styles.BasketItem_Text}>+</Text>
                </TouchableOpacity>

            </View>

        </View>

)}


    const styles = StyleSheet.create({

        BasketItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            maxWidth: '100%',
            // borderColor: '#C0C0C0',
            // borderTopWidth: 1,
            // borderBottomWidth: 1,
            paddingVertical: 8,
          },

          BasketItem_Checkbox: {
            width: 30,
            height: 30,
            marginLeft: 10,
            // borderColor: '#C0C0C0',
            // borderWidth: 1,
            // borderRadius: 100,
          },

          BasketItem_Name: {
            alignSelf: 'center',
            marginLeft: 20,
            flex: 1,
            // borderColor: '#C0C0C0',
            // borderWidth: 1,
          },    

          BasketItem_Text: {
            fontSize: SecondTitleFontSize,
            fontFamily: MainFont
          },

          BasketItem_AmountAndButtons: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%',
            width: 60,
            marginRight: 20,
            fontSize: 18,
            // position: 'relative',
            // left: '35%',
            // borderColor: '#C0C0C0',
            // borderWidth: 1,
          }
    
    
    });