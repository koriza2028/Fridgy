import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from "react-native";

import { buttonColor, addButtonColor, MainFont, MainFont_Bold } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import useAuthStore from '../../store/authStore';  // Correct path to your auth store
import { moveProductToBasket, decrementProductAmount, incrementProductAmount } from '../../store/fridgeStore'; // Import functions

const { width } = Dimensions.get('window');
// const productCardWidth = width*0.465;
const productCardWidth = width*0.46;
const productCardHeight = productCardWidth*1.34;

// Make the view for ipads too

export default function ProductCard(props) {
    const userId = useAuthStore((state) => state.user?.uid);

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    const handleDecrement = async (id) => {
        await decrementProductAmount(userId, id);
        props.onChange();
    };

    const handleIncrement = async (id) => {
        await incrementProductAmount(userId, id);
        props.onChange();
    };

    const handleMoveToBasket = async (id) => {
        await moveProductToBasket(userId, id);
        props.onChange();
    };

    
    return (         
        <View style={styles.ProductCard}>
            {props.product.imageUri ? (
                <Image
                    style={styles.ProductPicture}
                    source={props.product.imageUri}
                />
                ) : (
                <Image
                    style={styles.ProductPicture}
                    source={require('../../../assets/ProductImages/banana_test.png')}
                />
            )}
            <View style={styles.ProductInfoAndButtons}>

                <View style={styles.ProductAmountAndActions}>            
                    <TouchableOpacity style={styles.Button_AddOrRemoveProductAmount} onPress={() => handleDecrement(props.product.id)}>
                        <Text style={styles.Text_AddOrRemoveProductAmount}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.ProductAmountLabel}>{props.product.amount} {props.product.UoM}</Text>

                    <TouchableOpacity style={styles.Button_AddOrRemoveProductAmount} onPress={() => handleIncrement(props.product.id)}>
                        <Text style={styles.Text_AddOrRemoveProductAmount}>+</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.ProductNameAndCategory} onPress={() => props.onOpenModal(props.product)}>
                    <Text style={styles.ProductNameLabel}>{props.product.name}</Text>
                    <Text style={styles.ProductCategoryLabel}>{props.product.category.tagIcon}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.SendToBasket_Button} onPress={() => handleMoveToBasket(props.product.id)}>
                    <Text style={styles.SendToBasket_Button_Text}><MaterialCommunityIcons name="cart-arrow-right" size={24} /></Text>
                </TouchableOpacity>
                
            </View>
        </View>
    )
};



const styles = StyleSheet.create({
    ProductCard:{
        // backgroundColor: '#FFF',
        borderRadius: 10,
        marginVertical: 10,
        // marginHorizontal: width*0.01,
        width: productCardWidth,

        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    ProductPicture: {
        width: '100%',
        height: productCardWidth,
        // backgroundColor: 'blue',
        
        borderRadius: 10,
    },
    ProductInfoAndButtons: {
        justifyContent: 'space-between',
        alignItems: 'center',
        height: productCardHeight - productCardWidth,
        backgroundColor: '#FFF',  
        borderRadius: 10,  
        
    },
    ProductNameAndCategory: {
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        width: '100%',
        height: productCardHeight - productCardWidth,
        justifyContent: 'space-between',
        paddingLeft: 4,
        marginTop: -20 
    },
    ProductNameLabel: {
        fontWeight: 'bold',
        fontFamily: MainFont_Bold,
    },
    ProductCategoryLabel: {
        marginBottom: 10,
        fontFamily: MainFont,
        fontSize: 18,
    },
    ProductAmountAndActions: {
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        borderRadius: 6,
        backgroundColor: buttonColor,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        top: -36,

        shadowColor: buttonColor, 
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,  
    },
    ProductAmountLabel: {
        fontSize: 16,
        fontFamily: MainFont,
    },
    Button_AddOrRemoveProductAmount: {
      width: 60,
      height: 26,
      justifyContent: 'center',
      alignItems: 'center',
    //   borderColor: '#C0C0C0',
    //   borderWidth: 1,
    },
    Text_AddOrRemoveProductAmount: {
        fontSize: 20,
    },

    SendToBasket_Button: {
        position: 'absolute',
        right: 10,
        bottom: '40%'
    },

    SendToBasket_Button_Text: {
        // color: 'green',
        color: addButtonColor,
    },
});