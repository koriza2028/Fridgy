import React, { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { addButtonColor } from '../../../assets/Styles/styleVariables';

export default function AnimatedButtonColumn({onAClick}) {
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
          <Pressable style={styles.secondaryButton} onPress={onAClick}>
            <Text style={styles.buttonText}>A</Text>
          </Pressable>
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
          <Pressable style={styles.secondaryButton} onPress={() => console.log('B pressed')}>
            <Text style={styles.buttonText}>G</Text>
          </Pressable>
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
        bottom: 30,
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
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
