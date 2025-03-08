import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import { MainFont, TextFontSize, SecondTitleFontSize, MainFont_Bold, backgroundColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function Tag({ name, type, icon }) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    // const tagStyle = getTagStyle(type);
      
    return (
        <View style={[styles.TagBody, 
        // tagStyle
        ]}>
            {name && !icon && <Text style={[styles.TagName, {paddingVertical: 6,paddingHorizontal: 8,}]}>{name}</Text>}
            {icon && <Text style={[styles.TagIcon, {padding: 4,}]}>{icon}</Text>}
             
            {/* <Text style={styles.TagIcon}>{icon}</Text>  */}
        </View>
)};

// const getTagStyle = (type) => {
//     switch (type) {
//         case 1:
//             return styles.typeOne;
//         case 2:
//             return styles.typeTwo;
//         case 3:
//             return styles.typeThree;
//         case 3:
//             return styles.typeFour;
//         case 3:
//             return styles.typeFive;
//         default:
//             return styles.defaultType;
//     }
// };


const styles = StyleSheet.create({
    TagBody: {
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'grey',
        marginRight: 6,
        backgroundColor: backgroundColor
    },

    TagName: {
        fontFamily: MainFont_Bold,
        fontSize: TextFontSize,
        color: '#444',
        padding: 6,
    },

    TagIcon: {
        fontFamily: MainFont,
        fontSize: SecondTitleFontSize + 4,
    },

    // typeOne: {
    //     borderColor: 'darkred',
    // },

    // typeTwo: {
    //     borderColor: 'darkblue',
    // },

    // typeThree: {
    //     borderColor: 'darkgreen',
    // },

    // typeFour: {
    //     borderColor: 'darkorange',
    // },

    // typeFive: {
    //     borderColor: 'darkpurple',
    // },

    // defaultType: {
    //     borderColor: 'darkgray',
    // },
});