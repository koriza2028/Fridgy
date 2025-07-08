import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable } from 'react-native';
import AppImage from '../image/AppImage';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { addButtonColor, backgroundColor, buttonColor, MainFont, MainFont_Bold, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

export default function BasketItem({ product, onDecrement, onAdd, isChecked, onToggleCheckbox, openInfoModal, onChangeName, autobasket }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const decrementProduct = () => {
    onDecrement(product.basketId, product.amount);
  };

  const addProduct = () => {
    onAdd(product.basketId, product.amount);
  };

  const handleToggle = () => {
    onToggleCheckbox(!isChecked);
  };

  const [title, setTitle] = useState(product.name || "");

  useEffect(() => {
    setTitle(product.name || "");
  }, [product.name]);

  const onModalClose = () => { 
    setTitle(product.name);
    onClose();
  }

  return (
    <View style={styles.BasketItem}>
      {!autobasket && 
        <BouncyCheckbox style={styles.BasketItem_Checkbox}
            size={24}
            fillColor='black'
            unfillColor="#FFFFFF"
            innerIconStyle={{ borderWidth: 2, borderRadius: 8 }}
            onPress={handleToggle}
        />}        

      <View style={styles.BasketItem_Name}>
        <Pressable onPress={() => openInfoModal(product)}>
          <AppImage 
            style={styles.ProductPicture}
            imageUri={product.imageUri}
            staticImagePath={product.staticImagePath}
          />
        </Pressable>
        <View style={styles.BasketItem_Name_Button} >
          <Text 
            style={styles.BasketItem_Text} numberOfLines={2} ellipsizeMode="tail">
            {product.name}
          </Text>  
        </View>
      </View>

    </View>
  )
  

  
}

const styles = StyleSheet.create({
  BasketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    // width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: 16,
    marginBottom: 10,
    // borderBottomWidth: 1,
    // borderBottomColor: '#ddd',
    height: 54,
  },
  BasketItem_Checkbox: {
    width: 20,
    height: 20,
    marginLeft: 10,
    marginTop: 4,
  },
  BasketItem_Name: {
    alignSelf: 'center',
    marginLeft: 20,
    paddingRight: 10,
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    // borderWidth: 1,
  },
  BasketItem_Name_Button: {
    flexDirection: 'row',
    alignContent: 'center',
    width: '100%',
  },
  ProductPicture: {
    height: 46,
    width: 46,
    borderRadius: 10,
  },
  BasketItem_Text: {
    fontFamily: MainFont,
    fontSize: 14,
    alignSelf: 'center',
    marginLeft: 10,
  },
  textEdit: {
    outlineStyle: 'none',
    overflow: 'hidden',
  },
  BasketItem_AmountAndButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    width: 80,
    marginRight: 20,
  },
  BasketItem_ButtonText: { 
    fontFamily: MainFont_Bold,
    fontSize: 16,
  }
});
