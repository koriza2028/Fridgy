import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { addButtonColor, MainFont_Bold } from '../../assets/Styles/styleVariables';

const DURATION = 200;

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
} from 'react-native-reanimated';



const AddNewButton = ({ creativeAction }) => {

    const transition = useSharedValue(0);
    const isActive = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => {
      const scale = interpolate(transition.value, [0, 1], [1, 0.92]);
      const bgOverlayOpacity = interpolate(transition.value, [0, 1], [0, 0.15]);

      return {
        transform: [{ scale }],
        backgroundColor: `rgba(0, 0, 0, ${bgOverlayOpacity})`,
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
        onPress={creativeAction}
        style={styles.Button_AddProduct} // outer container needs position
        hitSlop={8}
      >
        <Animated.View style={[styles.InnerCircle, animatedStyle]}>
          <Text style={styles.Button_AddProduct_Text}>+</Text>
        </Animated.View>
      </Pressable>
    );



    // return (
    //     <Pressable style={styles.Button_AddProduct} onPress={() => creativeAction()}>
    //         <Text style={styles.Button_AddProduct_Text}>+</Text>
    //     </Pressable>
    // );
};

const styles = StyleSheet.create({
    Button_AddProduct: {
          position: 'absolute',
          bottom: 20,
          right: 20,
        //   flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 50,
          height: 50,
        //   paddingVertical: 15,
        //   paddingHorizontal: 15,
          backgroundColor: '#FFF',
          borderRadius: 60,
          borderColor: addButtonColor,
          borderWidth: 2,
          
          shadowColor: '#007bff', 
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 2,
          elevation: 2,        
        },

        InnerCircle: {
          width: '100%',
          height: '100%',
          borderRadius: 60,
          borderColor: addButtonColor,
          borderWidth: 2,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'transparent',
        },
    
        Button_AddProduct_Text: {
            fontFamily: MainFont_Bold,
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 4,
            // marginRight: 1,
        }
});

export default AddNewButton;