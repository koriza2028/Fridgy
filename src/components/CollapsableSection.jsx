import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Pressable } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';

import { MainFont, ReceiptFont, MainFont_Bold, MainFont_Title, SecondTitleFontSize } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';


const CollapsibleSection = ({ children, title}) => {

  const [fontsLoaded] = useFonts({
      'Grotesk': require('../../assets/fonts/Grotesk/SpaceGrotesk-Regular.ttf'),
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
      'Inter-Title': require('../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
  });

  return (
    <View style={styles.section}>
      <Text style={styles.FridgeProductListHeader}>{title}</Text>
      <View style={styles.FridgeProductLis}>
        {children}
      </View>
    </View>
  )

}


const styles = StyleSheet.create({

  section: {
    // padding: 4,
    marginBottom: 10,
    marginHorizontal: 10,
  },
    collapsibleView: {
      overflow: 'hidden',
    },

    CollapsableTitle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      // paddingRight: 20,
    },

    FridgeProductListHeader: {
      fontSize: SecondTitleFontSize,
      fontWeight: 800,
      fontFamily: MainFont_Title,
      marginBottom: 10,
      // paddingLeft: 4,
    },
    
    FridgeProductLis: {
        maxwidth: '100%',
        flexGrow: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    //   borderColor: '#C0C0C0',
    //   borderWidth: 1,
    }
  });

export default CollapsibleSection;