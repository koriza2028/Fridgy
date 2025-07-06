import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { addButtonColor, MainFont_Bold } from '../../assets/Styles/styleVariables';

const DURATION = 300;

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
} from 'react-native-reanimated';



const ButtonBouncing = ({ 
        label,
        onPress,
        isDisabled = false,
        isLoading = false,
        style,
        innerStyle,
        textStyle,
        toScale = 0.9,
    }) => {

    const transition = useSharedValue(0);
    const isActive = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => {

        const scale = interpolate(transition.value, [0, 1], [1, toScale]);
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
      style={style}
    >
      <Animated.View style={[innerStyle, animatedStyle]}>
        {isLoading ? (
          <ActivityIndicator color="white" size={18} />
        ) : (
          <Text style={[textStyle]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  
});

export default ButtonBouncing;