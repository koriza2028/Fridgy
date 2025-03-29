import React, {useState, useEffect} from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Image } from 'react-native';
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
    // <TouchableOpacity onPress={() => openInfoModal(product)}>
    //   <View style={styles.BasketItem}>
    //     <TouchableOpacity style={styles.BasketItem_Checkbox} onPress={handleToggle}>
    //       <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={32} />
    //     </TouchableOpacity>

    //     <View style={styles.BasketItem_Name}>
    //       <Image 
    //         style={styles.ProductPicture}
    //         source={ product.imageUri 
    //                   ? { uri: product.imageUri } 
    //                   : require('../../../assets/ProductImages/banana_test.png')
    //                }
    //       />
    //       {product.isFromFridge ? 

    //         <Text 
    //         style={styles.BasketItem_Text}
    //         numberOfLines={2}
    //         ellipsizeMode="tail"
    //       >
    //         {product.name}
    //       </Text>  
    //               : <TextInput value={product.name}></TextInput> }
          
    //     </View>

    //     <View style={styles.BasketItem_AmountAndButtons}>
    //       <TouchableOpacity style={styles.BasketItem_RemoveButton} onPress={decrementProduct}>
    //         <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>-</Text>
    //       </TouchableOpacity>

    //       <Text style={styles.BasketItem_Text}>{product.amount}</Text>

    //       <TouchableOpacity style={styles.BasketItem_AddButton} onPress={addProduct}>
    //         <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>+</Text>
    //       </TouchableOpacity>
    //     </View>
    //   </View>
    // </TouchableOpacity>

    product.isFromFridge ? (
      <TouchableOpacity onPress={() => openInfoModal(product)}>
        <View style={styles.BasketItem}>
          <TouchableOpacity style={styles.BasketItem_Checkbox} onPress={handleToggle}>
            <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={32} />
          </TouchableOpacity>

          <View style={styles.BasketItem_Name}>
            <Image 
              style={styles.ProductPicture}
              source={ product.imageUri 
                        ? { uri: product.imageUri } 
                        : require('../../../assets/ProductImages/banana_test.png')
                    }
            />
            <Text 
              style={styles.BasketItem_Text}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {product.name}
            </Text>  
          </View>

          <View style={styles.BasketItem_AmountAndButtons}>
          <TouchableOpacity style={styles.BasketItem_RemoveButton} onPress={decrementProduct}>
            <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>-</Text>
          </TouchableOpacity>

          <Text style={styles.BasketItem_Text}>{product.amount}</Text>

          <TouchableOpacity style={styles.BasketItem_AddButton} onPress={addProduct}>
             <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>+</Text>
           </TouchableOpacity>
         </View>

        </View>
      </TouchableOpacity>
    ) : (
      <View style={styles.BasketItem}>
        <TouchableOpacity style={styles.BasketItem_Checkbox} onPress={handleToggle}>
          <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={32} />
        </TouchableOpacity>

        <View style={styles.BasketItem_Name}>
          <Image 
            style={styles.ProductPicture}
            source={ product.imageUri 
                      ? { uri: product.imageUri } 
                      : require('../../../assets/ProductImages/banana_test.png')
                  }
          />
          <TextInput 
            multiline={true}
            numberOfLines={2}
            maxLength={20}
            value={title} 
            style={[styles.BasketItem_Text, styles.textEdit]}
            editable={true} // Ensure it's editable
            onChangeText={(text) => setTitle(text)} 
            onPressIn={(e) => e.stopPropagation()}
            onBlur={() => onChangeName(product.basketId, title)}
          />
        </View>

        <View style={styles.BasketItem_AmountAndButtons}>
          <TouchableOpacity style={styles.BasketItem_RemoveButton} onPress={decrementProduct}>
            <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>-</Text>
          </TouchableOpacity>

          <Text style={styles.BasketItem_Text}>{product.amount}</Text>

          <TouchableOpacity style={styles.BasketItem_AddButton} onPress={addProduct}>
             <Text style={[styles.BasketItem_Text, styles.BasketItem_ButtonText]}>+</Text>
           </TouchableOpacity>
         </View>

      </View>
    )
  );
}

const styles = StyleSheet.create({
  BasketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    maxWidth: '100%',
    paddingVertical: 8,
    paddingBottom: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
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
