import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';

import { MainFont, MainFont_Bold, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function BasketItem({ product, onDecrement, onAdd, isChecked, onToggleCheckbox }) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    // If the product is a string, treat it as the id/name and assume an initial amount of 1.
    const decrementProduct = () => {
        if (typeof product === 'string') {
            onDecrement(product, product.amount);
        } else {
            onDecrement(product.id, product.amount);
        }
    };

    const addProduct = () => {
        if (typeof product === 'string') {
            onAdd(product, product.amount);
        } else {
            onAdd(product.id, product.amount);
        }
    };

    const handleToggle = () => {
        // For string items, use the product value itself as id.
        onToggleCheckbox(typeof product === 'string' ? product : product.id, !isChecked);
    };

    return (
        <View style={styles.BasketItem}>
            <TouchableOpacity style={styles.BasketItem_Checkbox} onPress={handleToggle}>
                <FontAwesomeIcons name={isChecked ? 'check-square' : 'square-o'} size={32} />
            </TouchableOpacity>

            <View style={styles.BasketItem_Name}>
                <Image style={styles.ProductPicture} 
                    source={product.imageUri ? { uri: product.imageUri } : require('../../../assets/ProductImages/banana_test.png')}>
                </Image>

                <Text style={styles.BasketItem_Text} 
                    numberOfLines={2} ellipsizeMode="tail" 
                    >{product.name}</Text>
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
        // marginTop: 8,
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
        fontSize: SecondTitleFontSize,
        fontFamily: MainFont,
        fontSize: 14,
        alignSelf: 'center',
        marginLeft: 10,
        // overflow: 'hidden',
        // textOverflow: 'ellipsis',
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
