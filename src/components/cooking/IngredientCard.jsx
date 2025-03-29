import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Image, TouchableOpacity } from 'react-native';

export default function IngredientItem({ ingredient, isAvailable, onRemove, isMandatory, isEditing, isCreatingNew }) {

  const removeProduct = () => {
    onRemove(ingredient._id, isMandatory);
  };

  const getImageSource = (ingredient) => {
    if (ingredient.imageUri) {
        return { uri: ingredient.imageUri };
    }
    if (ingredient.staticImagePath) {
        return ingredient.staticImagePath;
    }
    return require('../../../assets/ProductImages/banana_test.png');
  };

  const borderColor = ingredient.amount > 0 ? 'green' : 'red';

    return (
        <View style={[styles.IngredientItem, { borderColor: borderColor }, !isAvailable && { borderWidth: 1 }]}>
                     
            <Image 
              style={styles.IngredientItem_Picture} 
              source={getImageSource(ingredient)}
            />

            <View style={[styles.IngredientItem_NameAndInstructions, !isMandatory && styles.IngredientItem_OnlyName]}>
                <View style={styles.IngredientItem_Name}>
                  <Text style={styles.IngredientItem_Name_Text}>{ingredient.name} </Text>
                </View>
                {isMandatory && (<TextInput style={styles.IngredientItem_Instructions} placeholder='How much?'></TextInput>)}
                
                {/* Will be expandable or ...? */}
            </View>
            
          <TouchableOpacity style={styles.IngredientItem_RemoveButton} onPress={removeProduct}>
            <Text style={styles.IngredientItem_RemoveButton_Text}>X</Text>
            {/* Will be replaced with Swipe */}
          </TouchableOpacity>

        </View>

)}

const styles = StyleSheet.create({

    IngredientItem: {
        flexDirection: 'row',
        marginVertical: 6,
        // justifyContent: 'space-between',
        // width: '90%',
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        borderRadius: 10,
        // borderTopWidth: 1,
        
      },

      IngredientItem_Picture: {
        width: 50,
        height: 50,
        borderRadius: 60,
        // marginLeft: 6,
      },

      IngredientItem_NameAndInstructions: {
        marginTop: 4,
        marginLeft: 10,
        marginBottom: 4,
        width: '70%',
        justifyContent: 'space-between',
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
      },

      IngredientItem_OnlyName: {
        justifyContent: 'center',
      },

      IngredientItem_Name_Text: {
        fontSize: 16,
        fontWeight: 700,
      },

      IngredientItem_Instructions: {
        
      },

      IngredientItem_RemoveButton: {
        position: 'absolute',
        right: 20,
        top: '30%',
      },
      IngredientItem_RemoveButton_Text: {
        fontSize: 20,
      }

});