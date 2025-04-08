import React, {useState, useEffect, useRef} from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, Image } from 'react-native';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

import { MainFont, MainFont_Bold, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function BasketCustomItem({ product, onDecrement, onAdd, isChecked, onToggleCheckbox, onChangeName, swipeOpen }) {
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
  // const inputRef = useRef();
  
    useEffect(() => {
      setTitle(product.name || "");
    }, [product.name]);
  
    // onModalClose = () => { 
    //   setTitle(product.name);
    //   onClose();
    // }

  const getImageSource = (product) => {
    if (product.imageUri) return product.imageUri;
    if (product.staticImagePath) return product.staticImagePath;
    return require('../../../assets/ProductImages/banana_test.png');
  };

  return (
      <View style={styles.BasketItem}>
        <Pressable style={styles.BasketItem_Checkbox} onPress={handleToggle}>
          <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={24} />
        </Pressable>

        <View style={styles.BasketItem_Name}>
          <Image 
            style={styles.ProductPicture}
            source={ getImageSource(product)}
          />
          <TextInput 


          onStartShouldSetResponderCapture={() => false}
          maxLength={30}
          value={title} 
          style={[styles.BasketItem_Text, styles.textEdit]}
          selectTextOnFocus={false}
          editable={!swipeOpen}  // disable editing when the row is swiped open
          onChangeText={(text) => setTitle(text)} 
          onBlur={() => onChangeName(product.basketId, title)}
            
          />
        </View>

        <View style={styles.BasketItem_AmountAndButtons}>
          <Text>*</Text>
          {/* <Pressable style={styles.BasketItem_RemoveButton} onPress={decrementProduct}>
            <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>-</Text>
          </Pressable>

          <Text style={styles.BasketItem_Text}>{product.amount}</Text>

          <Pressable style={styles.BasketItem_AddButton} onPress={addProduct}>
             <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>+</Text>
           </Pressable> */}
         </View>

      </View>
  );
}

const styles = StyleSheet.create({
  BasketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    maxWidth: '100%',
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
  },
  BasketItem_Name: {
    alignSelf: 'center',
    marginLeft: 20,
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
    flex: 1,
  },
  BasketItem_AmountAndButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    // width: 80,
    marginRight: 20,
  },
  BasketItem_ButtonText: { 
    fontFamily: MainFont_Bold,
    fontSize: 16,
  }
});
