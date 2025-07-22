import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { MainFont, MainFont_Bold, MainFont_Title, TextFontSize, addButtonColor, buttonColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

const { width } = Dimensions.get('window');

export default function SecondDropdownComponent({
  allOptions,
  placeholder = 'Select tag',
  globalReset,
  onSelect,
}) {
  const [fontsLoaded] = useFonts({
          'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
          'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
          'Inter-Title': require('../../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
        });


  const [selectedValues, setSelectedValues] = useState([]);
  const [isFocus, setIsFocus] = useState(false);

  // Convert to dropdown-friendly format
  const mappedOptions = [
    { label: '❌ Reset filters', value: '__clear__' },
    ...(Array.isArray(allOptions)
      ? allOptions.map((opt) => ({
          label: `${opt.tagIcon} ${opt.tagName}`,
          value: opt.tagName,
          raw: opt, // save full original object for selection
        }))
      : []),
  ];

  useEffect(() => {
    setSelectedValues([]);
    if (typeof onSelect === 'function') onSelect([]);
  }, [globalReset]);

  const toggleSelection = (value) => {
    if (value === '__clear__') {
      setSelectedValues([]);
      onSelect?.([]);
      return;
    }

    const isSelected = selectedValues.includes(value);
    const newSelected = isSelected
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];

    setSelectedValues(newSelected);

    const selectedObjects = mappedOptions
      .filter((opt) => newSelected.includes(opt.value))
      .map((opt) => opt.raw)
      .filter(Boolean); // ignore ❌ option

    onSelect?.(selectedObjects);
  };

  const getDynamicPlaceholder = () => {
    if (!selectedValues.length) return placeholder;
  
    if (selectedValues.length > 3) {
      return `${selectedValues.slice(0, 4).join(', ')} +${selectedValues.length - 3} more`;
    }
  
    return selectedValues.join(', ');
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.label, isFocus && { color: addButtonColor }]}>
        Filters
      </Text>
      <Dropdown
        style={[styles.dropdown, isFocus && { borderColor: addButtonColor }]}
        containerStyle={styles.dropdownOptionsContainer}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        iconStyle={styles.iconStyle}
        data={mappedOptions}
        search
        searchPlaceholder="Search tag..."
        inputSearchStyle={{
          height: 40,
          fontSize: 14,
          fontFamily: MainFont,
          borderRadius: 10,
        }}
        maxHeight={280}
        labelField="label"
        valueField="value"
        value={selectedValues} // technically unused for multi
        placeholder={getDynamicPlaceholder()}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        renderLeftIcon={() => (
          <AntDesign
            style={styles.icon}
            color={isFocus ? addButtonColor : 'black'}
            name="filter"
            size={18}
          />
        )}
        renderItem={(item) => {
          if (item.value === '__clear__') {
            return (
              <Pressable
                onPress={() => {
                  setSelectedValues([]);
                  onSelect?.([]);
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>{item.label}</Text>
              </Pressable>
            );
          }
        
          const isSelected = selectedValues.includes(item.value);
          return (
            <Pressable
              onPress={() => toggleSelection(item.value)}
              style={[
                styles.dropdownOption,
                isSelected && styles.dropdownOptionSelected,
              ]}
            >
              <Text style={styles.optionText}>
                {isSelected ? '☑️' : '⬜'} {item.label}
              </Text>
            </Pressable>
            );
          }}
        />
      </View>
      );
}

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
      paddingHorizontal: 4,
      paddingTop: 4,
      width: width - 20,
    },
    icon: {
      marginRight: 4,
    },
    label: {
      position: 'absolute',
      backgroundColor: 'white',
      left: 4,
      top: -6,
      zIndex: 999,
      paddingHorizontal: 2,
      fontSize: 12,
      borderTopRightRadius: 8,
      borderTopLeftRadius: 8,
      fontFamily: MainFont,
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
      fontFamily: MainFont,
    },
    dropdownOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
      // borderBottomWidth: 1,
      borderColor: 'lightgrey',
      backgroundColor: 'white',
      borderRadius: 6,
    },
    
    dropdownOptionSelected: {
      backgroundColor: '#f0f0f0', // Light grey to highlight selected
    },
    
    optionText: {
      fontSize: TextFontSize,
      fontFamily: MainFont,
    },

    clearButton: {
      marginLeft: 10,
      marginVertical: 6,
    }
  });
