import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import AppImage from '../image/AppImage';

export default function IngredientItem({ ingredient, isAvailable, onRemove, isMandatory, isEditing, isCreatingNew }) {

  const removeProduct = () => {
    onRemove(ingredient._id, isMandatory);
  };

  const borderColor = ingredient.amount > 0 ? 'green' : 'red';

    return (
        <View style={[styles.IngredientItem, { borderColor: borderColor }, !isAvailable && { borderWidth: 1 }]}>

             <AppImage 
              style={styles.IngredientItem_Picture}
              imageUri={ingredient.imageUri}
              staticImagePath={ingredient.staticImagePath}
            />

            <View style={[styles.IngredientItem_NameAndInstructions, !isMandatory && styles.IngredientItem_OnlyName]}>
                <View style={styles.IngredientItem_Name}>
                  <Text style={styles.IngredientItem_Name_Text}>{ingredient.name} </Text>
                </View>

            </View>


        </View>
)}

const styles = StyleSheet.create({

    IngredientItem: {
        flexDirection: 'row',
        // marginVertical: 6,
        marginHorizontal: 10,
        // marginTop: 20,
        
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
        borderRadius: 30,
        // marginLeft: 6,
      },

      IngredientItem_NameAndInstructions: {
        marginTop: 4,
        marginLeft: 12,
        marginBottom: 4,
        width: '70%',
        justifyContent: 'center',
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
      },

      IngredientItem_OnlyName: {
        justifyContent: 'center',
      },

      IngredientItem_Name_Text: {
        fontSize: 16,
        // fontWeight: 700,
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