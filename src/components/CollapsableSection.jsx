import React, { useEffect, useState, useRef } from 'react';
import { View, Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';

import { MainFont, ReceiptFont, MainFont_Bold, MainFont_Title, SecondTitleFontSize } from '../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

// const CollapsibleSection = ({ children, title}) => {

//   const [fontsLoaded] = useFonts({
//       'Grotesk': require('../../assets/fonts/Grotesk/SpaceGrotesk-Regular.ttf'),
//       'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
//       'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
//       'Inter-Title': require('../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
//   });

//   const [isCollapsed, setIsCollapsed] = useState(false); // State for collapse/expand
//   const [contentHeight, setContentHeight] = useState(0); // Measured content height
//   const animationHeight = useRef(new Animated.Value(0)).current; // Animation height

//   const [IconDirection, setIconDirection] = useState('down');

//   // Toggle collapse/expand
//   const toggleCollapse = () => {
//     Animated.timing(animationHeight, {
//       toValue: isCollapsed ? contentHeight : 0, // Expand to content height or collapse to 0
//       duration: 100, // Animation duration
//       useNativeDriver: false, // Height animations require `false`
//     }).start(() =>  { 
//       setIconDirection(isCollapsed ? "down" : "up");
//       setIsCollapsed(!isCollapsed);
//     }); 
//   };

//   useEffect(() => {
//     if (contentHeight > 0) {
//       animationHeight.setValue(contentHeight); // Set initial height
//     }
//   }, [contentHeight]);


//   const handleLayout = (event) => {
//     const { height } = event.nativeEvent.layout;
//     setContentHeight(height); // Save the measured height
//     if (!isCollapsed && animationHeight._value === 0) {
//       animationHeight.setValue(height); // Set initial expanded height
//     }
//   };


//   return (
//     <View style={styles.section}>
//       <TouchableOpacity
//         onPress={toggleCollapse}
//         style={styles.CollapsableTitle}
//         accessibilityLabel={`Toggle ${title} section`}
//       >
//         <Text style={styles.FridgeProductListHeader}>{title}</Text>
//         <Entypo name={`chevron-${IconDirection}`} size={32} />
//       </TouchableOpacity>

//     {/* Immediately render the children but apply animation to height */}
//     <Animated.View
//       style={[
//         styles.collapsibleView,
//         { height: animationHeight }, // Animate height based on measured height
//       ]}
//     >
//       <View
//         style={styles.FridgeProductLis}
//         onLayout={handleLayout} // Measure the content height
//       >
//         {children}
//       </View>
//     </Animated.View>
//   </View>

//   );
// };

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
        // paddingHorizontal: 5,
    //   borderColor: '#C0C0C0',
    //   borderWidth: 1,
    }
  });

export default CollapsibleSection;