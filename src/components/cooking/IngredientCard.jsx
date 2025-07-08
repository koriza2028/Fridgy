import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable, Alert } from 'react-native';

import AppImage from '../image/AppImage';

import { deleteButtonColor } from '../../../assets/Styles/styleVariables';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function IngredientItem({ ingredient, isAvailable, onRemove, isMandatory, isEditing, isCreatingNew }) {

  const removeProduct = () => {
    Alert.alert(
      "Delete Ingredient?",
      "",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            onRemove(ingredient._id, isMandatory);
          },
        },
      ],
      { cancelable: true }
    );
  };


  // const borderColor = ingredient.amount > 0 ? 'green' : 'red';

    return (
        <View style={[styles.IngredientItem, 
          // { borderColor: borderColor }, !isAvailable && { borderWidth: 1 }
        ]}>

             <AppImage 
              style={styles.IngredientItem_Picture}
              imageUri={ingredient.imageUri}
              staticImagePath={ingredient.staticImagePath}
            />

            <View style={[styles.IngredientItem_NameAndInstructions, !isMandatory && styles.IngredientItem_OnlyName]}>
              <View style={styles.IngredientItem_Name}>
                <Text style={styles.IngredientItem_Name_Text}>{ingredient.name} </Text>
              </View>

              <Pressable style={styles.removeIcon} onPress={removeProduct}> 
                {/* <Text>-</Text> */}
                <MaterialIcons name={'remove-circle'} size={22} color={deleteButtonColor} />
              </Pressable>
            </View>


        </View>
)}

const styles = StyleSheet.create({

    IngredientItem: {
        flexDirection: 'row',
        marginVertical: 6,
        marginHorizontal: 10,
        // marginTop: 20,
        
        // justifyContent: 'space-between',
        width: '100%',
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        // backgroundColor: 'white',
        // borderRadius: 10,
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


      IngredientItem_Name_Text: {
        fontSize: 16,
        // fontWeight: 700,
      },

      removeIcon: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 30,
        height: 30,
        // backgroundColor: deleteButtonColor,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
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