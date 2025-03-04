import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function BasketSection({ children, category }) {

    if (React.Children.count(children) === 0) {
        return null; // Do not render anything if no children
      }
      
    return (
        <View style={styles.BasketSection}>

            <Text style={styles.BasketSection_Text}>{category}</Text>

            {children}


        </View>

)}

    const styles = StyleSheet.create({

        BasketSection: {
            marginBottom: 10,
        },

        BasketSection_Text: {
            marginBottom: 6,
            marginLeft: 10,
        }
    
    
    });