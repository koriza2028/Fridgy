import React, {useState, useEffect} from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, Image } from 'react-native';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

import { MainFont, MainFont_Bold, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function BasketItem({ product, onDecrement, onAdd, isChecked, onToggleCheckbox, openInfoModal, onChangeName }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  // Use basketId for all operations
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
  
    onModalClose = () => { 
      setTitle(product.name);
      onClose();
    }

  return (
      <Pressable onPress={() => openInfoModal(product)}>
        <View style={styles.BasketItem}>
          {/* <Pressable style={styles.BasketItem_Checkbox} onPress={handleToggle}>
            <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={24} />
          </Pressable> */}

          <View style={styles.BasketItem_Name}>
            <AppImage 
              style={styles.ProductPicture}
              imageUri={product.imageUri}
              staticImagePath={product.staticImagePath}
            />
            <Text 
              style={styles.BasketItem_Text}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {product.name}
            </Text>  
          </View>

          {/* <View style={styles.BasketItem_AmountAndButtons}>
          <Pressable style={styles.BasketItem_RemoveButton} onPress={decrementProduct}>
            <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>-</Text>
          </Pressable>

          <Text style={styles.BasketItem_Text}>{product.amount}</Text>

          <Pressable style={styles.BasketItem_AddButton} onPress={addProduct}>
             <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>+</Text>
           </Pressable>
         </View> */}

        </View>
      </Pressable>
    
  );
}

const styles = StyleSheet.create({
  BasketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    width: '100%',
    paddingVertical: 8,
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
  },
  BasketItem_Name: {
    alignSelf: 'center',
    paddingRight: 10,
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
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
