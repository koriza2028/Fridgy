import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { addButtonColor, MainFont_Bold } from '../../assets/Styles/styleVariables';

import { ResizingButton } from './Button_Bouncing';

// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
// } from 'react-native-reanimated';

// const ReanimatedButton = ({ label, onPress }) => {
//   const scale = useSharedValue(1);

//   const animatedStyle = useAnimatedStyle(() => {
//     return {
//       transform: [{ scale: scale.value }],
//     };
//   });

//   const handlePressIn = () => {
//     scale.value = withSpring(0.95, { damping: 10 });
//   };

//   const handlePressOut = () => {
//     scale.value = withSpring(1, { damping: 10 });
//     onPress?.();
//   };

//   return (
//     <Animated.View style={[
//         animatedStyle,
//         styles.Button_AddOrRemoveProductAmount, // put this here instead
//     ]}
// >
//       <Pressable
//         onPressIn={handlePressIn}
//         onPressOut={handlePressOut}
//         style={styles.Button_AddProduct}
//       >
//         <Text style={styles.Button_AddProduct_Text}>{label}</Text>
//       </Pressable>
//     </Animated.View>
//   );
// };


const AddNewButton = ({ creativeAction }) => {
    return (
        <Pressable style={styles.Button_AddProduct} onPress={() => creativeAction()}>
            <Text style={styles.Button_AddProduct_Text}>+</Text>
        </Pressable>
    );
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
    
        Button_AddProduct_Text: {
            fontFamily: MainFont_Bold,
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 4,
            // marginRight: 1,
        }
});

export default AddNewButton;