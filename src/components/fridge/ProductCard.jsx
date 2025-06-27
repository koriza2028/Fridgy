import React from "react";
import { StyleSheet, View, Text, Pressable, Dimensions, ActivityIndicator } from "react-native";
import AppImage from "../../components/image/AppImage";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

const DURATION = 200;

import { buttonColor, addButtonColor, MainFont, MainFont_Bold, MainFont_SemiBold } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import useAuthStore from '../../store/authStore';  // Correct path to your auth store
import { moveProductToBasket, decrementProductAmount, incrementProductAmount } from '../../store/fridgeStore'; // Import functions

const { width } = Dimensions.get('window');
// const productCardWidth = width*0.465;
const productCardWidth = width*0.46;
const productCardHeight = productCardWidth*1.34;

// Make the view for ipads too


const ReanimatedButton = ({ 
        label = 'A',
        onPress,
        isDisabled = false,
        isLoading = false,
    }) => {

    const transition = useSharedValue(0);
    const isActive = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => {

        const scale = interpolate(transition.value, [0, 1], [1, 0.95]);
        const bgOpacity = interpolate(transition.value, [0, 1], [0, 0.25]); // darken background

        return {
            transform: [{ scale }],
            backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`, // overlay blend
        };
    });

  const handlePressIn = () => {
    isActive.value = true;
    transition.value = withTiming(1, { duration: DURATION }, () => {
      if (!isActive.value) {
        transition.value = withTiming(0, { duration: DURATION });
      }
    });
  };

  const handlePressOut = () => {
    isActive.value = false;
    transition.value = withTiming(0, { duration: DURATION });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={isDisabled || isLoading}
      hitSlop={8}
    >
      <Animated.View style={[styles.Button_AddOrRemoveProductAmount, animatedStyle, isDisabled && { opacity: 0.5 }]}>
        {isLoading ? (
          <ActivityIndicator color="white" size={18} />
        ) : (
          <Text style={[styles.Text_AddOrRemoveProductAmount]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
};


export default function ProductCard(props) {
    const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });


    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
        'Inter-SemiBold': require('../../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
    });

    const handleDecrement = async (id) => {
        await decrementProductAmount(ctx, id);
        props.onChange();
    };

    const handleIncrement = async (id) => {
        await incrementProductAmount(ctx, id);
        props.onChange();
    };

    const handleMoveToBasket = async (id) => {
        await moveProductToBasket(ctx, id);
        props.onChange();
        props.onMoveToBasket();
    };

    return (         
        <Pressable style={styles.ProductCard} onPress={() => props.onOpenModal(props.product)}>
            <AppImage
                imageUri={props.product.imageUri}
                staticImagePath={props.product.staticImagePath}
                style={styles.ProductPicture}
                contentFit="cover"
                cachePolicy="disk"
            />

            <View style={styles.ProductInfoAndButtons}>

                <View style={styles.ProductAmountAndActions}>            
                    {/* <Pressable style={styles.Button_AddOrRemoveProductAmount} onPress={() => handleDecrement(props.product.id)}>
                        <Text style={styles.Text_AddOrRemoveProductAmount}>-</Text>
                    </Pressable> */}

                    <ReanimatedButton label="-" onPress={() => handleDecrement(props.product.id)}></ReanimatedButton>

                    <Text style={styles.ProductAmountLabel}>{props.product.amount} {props.product.UoM}</Text>

                    {/* <Pressable style={styles.Button_AddOrRemoveProductAmount} onPress={() => handleIncrement(props.product.id)}>
                        <Text style={styles.Text_AddOrRemoveProductAmount}>+</Text>
                    </Pressable> */}

                    <ReanimatedButton label="+" onPress={() => handleIncrement(props.product.id)}></ReanimatedButton>
                    {/* <Text style={styles.ProductAmountLabel}>{props.product.name}</Text> */}
                </View>

                <View style={styles.ProductNameAndCategory} >
                    <Text style={styles.ProductNameLabel}>{props.product.name}</Text>
                    {/* <Text style={styles.ProductCategoryLabel}>{props.product.category.tagIcon}</Text> */}
                </View>


                {/* <Pressable style={styles.Availability_Button} >
                    <Text style={styles.Availability_Button_Text}>Availability</Text>
                </Pressable> */}

                <Pressable style={styles.SendToBasket_Button} onPress={() => handleMoveToBasket(props.product.id)}>
                    <Text style={styles.SendToBasket_Button_Text}><MaterialCommunityIcons name="cart-arrow-right" size={24} /></Text>
                </Pressable>
                
            </View>
        </Pressable>
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
        // overflow: 'hidden',
    },
    ProductPicture: {
        width: '100%',
        height: productCardWidth -16,
        // backgroundColor: 'blue',  
        
        borderRadius: 10,
    },
    ProductInfoAndButtons: {
        justifyContent: 'space-between',
        alignItems: 'center',
        height: productCardHeight - productCardWidth -10,
        backgroundColor: '#FFF',  
        borderRadius: 10,      
        // marginTop: -20,
    },
    ProductNameAndCategory: {
        // borderColor: '#C0C0C0',
        // borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 4,
        width: '82%',
        height: "100%",
        justifyContent: 'center',
        alignSelf: 'start',
        marginTop: -24,
    },
    ProductNameLabel: {
        fontWeight: 'bold',
        fontFamily: MainFont_Bold,
    },
    ProductCategoryLabel: {
        marginBottom: 4,
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
      borderRadius: 6,
    //   borderColor: '#C0C0C0',
    //   borderWidth: 1,
    },
    Text_AddOrRemoveProductAmount: {
        fontSize: 22,
    },

    SendToBasket_Button: {
        position: 'absolute',
        right: 10,
        bottom: '30%'
    },

    SendToBasket_Button_Text: {
        // color: 'green',
        color: addButtonColor,
    },

});