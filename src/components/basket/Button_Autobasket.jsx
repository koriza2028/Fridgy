import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import ButtonBouncing from '../Button_Bouncing';

import { addButtonColor } from '../../../assets/Styles/styleVariables';

export default function AnimatedButtonColumn({onAClick, onGClick}) {
    const [expanded, setExpanded] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;
  
    const toggleButtons = () => {
      Animated.timing(animation, {
        toValue: expanded ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setExpanded(!expanded);
    };
  
    const translateY1 = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -60],
    });
  
    const translateY2 = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -120],
    });
  
    const opacity = animation;
  
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.animatedWrapper,
            {
              transform: [{ translateY: translateY2 }],
              opacity,
            },
          ]}
        >

          <ButtonBouncing 
            innerStyle={styles.secondaryButton} style={{width: 50, height: 50, borderRadius: 30}}
            onPress={onAClick}
            label={<Text style={styles.buttonText}>A</Text>} toScale={0.9}
          />

        </Animated.View>
  
        <Animated.View
          style={[
            styles.animatedWrapper,
            {
              transform: [{ translateY: translateY1 }],
              opacity,
            },
          ]}
        >

          <ButtonBouncing innerStyle={styles.secondaryButton} style={{width: 50, height: 50, borderRadius: 30}}
            onPress={onGClick}
            label={<Text style={styles.buttonText}>G</Text>} toScale={0.9}
          />

        </Animated.View>
  
        <Pressable style={styles.mainButton} onPress={toggleButtons}>
          <Text style={styles.buttonText}>A</Text>
        </Pressable>
      </View>
    );
  }


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    // paddingBottom: 100,

    position: 'absolute',
    bottom: 20,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 10,
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
  animatedWrapper: {
    position: 'absolute',
    zIndex: 2,
  },
  mainButton: {
    backgroundColor: '#4e6ef2',
    padding: 16,
    borderRadius: 30,
    zIndex: 3,
  },
  secondaryButton: {
    backgroundColor: '#999',
    padding: 16,
    borderRadius: 30,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
