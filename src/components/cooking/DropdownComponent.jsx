import React, { useState, useEffect } from 'react';
  import { StyleSheet, Text, View } from 'react-native';
  import { Dropdown } from 'react-native-element-dropdown';
  import AntDesign from '@expo/vector-icons/AntDesign';

  import { MainFont, MainFont_Bold, MainFont_Title, TextFontSize, addButtonColor, buttonColor } from '../../../assets/Styles/styleVariables';
  import { useFonts } from 'expo-font';

  const data = [
    { label: 'Item aa', value: 'a' },
    { label: 'Item 2', value: '2' },
    { label: 'Item 3', value: '3' },
    { label: 'Item 4', value: '4' },
    { label: 'Item 5', value: '5' },
    { label: 'Item 6', value: '6' },
    { label: 'Item 7', value: '7' },
    { label: 'Item 8', value: '8' },
  ];

  export default DropdownComponent = ({tagType, options, placeholder, globalReset, onSelect}) => {
    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
        'Inter-Title': require('../../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
      });

    const getLabelForTagType = (tagType) => {
      switch (Number(tagType)) {
        case 1:
          return 'Cooking';
        case 2:
          return 'Category';
        case 3:
          return 'Cuisine';
        default:
          return 'Option';
      }
    };
    
    const [value, setValue] = useState(null);
    const [isFocus, setIsFocus] = useState(false);

    useEffect(() => {
      setValue(null);
      if (onSelect) onSelect([]);
    }, [globalReset]);
  
    const label = getLabelForTagType(tagType);
  
    const mappedOptions = [
      { label: '❌ Anything', value: '__clear__' },
      ...(
        Array.isArray(options)
          ? options.map((opt) => ({
              label: `${opt.tagIcon} ${opt.tagName}`,
              value: opt.tagName,
            }))
          : []
      ),
    ];
  
    const handleChange = (item) => {
      if (item.value === '__clear__') {
        setValue(null);
        if (onSelect) onSelect([]);
        return;
      }
    
      setValue(item.value);
      setIsFocus(false);
    
      if (onSelect) {
        const selectedOption = options.find((opt) => opt.tagName === item.value);
        onSelect(selectedOption ? [selectedOption] : []);
      }
    };
    



    // const renderLabel = () => {
    //   if (value || isFocus) {
    //     return (
    //       <Text style={[styles.label, isFocus && { color: 'blue' }]}>
    //         Your options
    //       </Text>
    //     );
    //   }
    //   return null;
    // };

    return (
      <View style={styles.container}>
        {/* {renderLabel()} */}
        <Text style={[styles.label, isFocus && { color: addButtonColor }]}>{label}</Text>
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: addButtonColor }]}
          containerStyle={styles.dropdownOptionsContainer}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={mappedOptions}
          // maxHeight={300}
          labelField="value"
          valueField="value"
          placeholder={!isFocus ? placeholder || label : '...'}
          // searchPlaceholder="Any..."
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={handleChange}
          renderItem={(item, selected) => (
            <View
              style={[
                styles.dropdownOption,
                selected && styles.dropdownOptionSelected,
              ]}
            >
              <Text style={styles.optionText}>{item.label}</Text>
            </View>
          )}
          renderLeftIcon={() => (
            <AntDesign
              style={styles.icon}
              color={isFocus ? addButtonColor : 'black'}
              name="filter"
              size={18}
            />
          )}
        />
      </View>
    );

    // return (
    //   <View style={styles.container}>
    //     {renderLabel()}
    //     <Dropdown
    //       style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
    //       placeholderStyle={styles.placeholderStyle}
    //       selectedTextStyle={styles.selectedTextStyle}
    //       inputSearchStyle={styles.inputSearchStyle}
    //       iconStyle={styles.iconStyle}
    //       data={data}
    //       // search
    //       maxHeight={300}
    //       labelField="label"
    //       valueField="value"
    //       placeholder={!isFocus ? 'Cooking time' : '...'}
    //       searchPlaceholder="Search..."
    //       value={value}
    //       onFocus={() => setIsFocus(true)}
    //       onBlur={() => setIsFocus(false)}
    //       onChange={item => {
    //         setValue(item.value);
    //         setIsFocus(false);
    //       }}
    //       renderLeftIcon={() => (
    //         <AntDesign
    //           style={styles.icon}
    //           color={isFocus ? 'blue' : 'black'}
    //           name="Safety"
    //           size={20}
    //         />
    //       )}
    //     />
    //   </View>
    // );
  };

  // export default DropdownComponent;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'white',
      // padding: 6,
      margin: 6,
      borderRadius: 10,
    },
    dropdownOptionsContainer: {
      borderRadius: 10,
      paddingVertical: 4,
    },
    dropdown: {
      height: 40,
      backgroundColor: 'white',
      borderWidth: 0.5,
      borderRadius: 10,
      paddingHorizontal: 0,
      paddingTop: 4,
      // minWidth: 120,
    },
    icon: {
      // paddingHorizontal: 4,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'white',
      left: 2,
      top: -6,
      zIndex: 999,
      paddingHorizontal: 2,
      fontSize: 12,
      borderTopRightRadius: 8,
      borderTopLeftRadius: 8,
    },
    placeholderStyle: {
      fontSize: 14,
    },
    selectedTextStyle: {
      fontSize: 14,
    },
    iconStyle: {
      width: 20,
      height: 20,
    },
    inputSearchStyle: {
      height: 40,
      fontSize: 14,
    },
    dropdownOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderColor: 'lightgrey',
      backgroundColor: 'white',
      borderRadius: 20,
    },
    
    dropdownOptionSelected: {
      backgroundColor: '#f0f0f0', // Light grey to highlight selected
    },
    
    optionText: {
      fontSize: TextFontSize,
      fontFamily: MainFont,
    },
  });

  // const styles = StyleSheet.create({
  //   container: {
  //     marginBottom: 6,
  //     marginRight: 6,
  //     borderWidth: 1,
  //     borderColor: '#ccc',
  //     borderRadius: 10,
  //     backgroundColor: 'white',
  //     overflow: 'hidden',
  //   },
  //   dropdown: {
  //     height: 40,
  //     borderColor: '#ccc',
  //     borderWidth: 1,
  //     borderRadius: 10,
  //     paddingHorizontal: 8,
  //     justifyContent: 'center',
  //   },
  //   placeholderStyle: {
  //     fontSize: TextFontSize,
  //     fontFamily: MainFont,
  //     color: '#999',
  //   },
  //   selectedTextStyle: {
  //     fontSize: TextFontSize,
  //     fontFamily: MainFont_Bold,
  //     color: 'black',
  //   },
  //   iconStyle: {
  //     width: 20,
  //     height: 20,
  //   },
  //   inputSearchStyle: {
  //     height: 40,
  //     fontSize: TextFontSize,
  //     fontFamily: MainFont,
  //   },
  //   icon: {
  //     marginRight: 5,
  //   },
  //   label: {
  //     fontSize: TextFontSize,
  //     fontFamily: MainFont_Bold,
  //     marginBottom: 4,
  //     marginLeft: 4,
  //   },
  //   selectedDropdownContainer: {
  //     backgroundColor: buttonColor,
  //   },
  //   selectedDropdownContainer_Text: {
  //     fontFamily: MainFont_Bold,
  //     color: 'white',
  //   },
  // });
  