import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, Dimensions, StyleSheet } from 'react-native';
import { Entypo } from '@expo/vector-icons';

import { MainFont, MainFont_Bold, MainFont_Title, TextFontSize, addButtonColor, buttonColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

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

const Dropdown = ({ tagType, options, placeholder, globalReset, onSelect }) => {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    'Inter-Title': require('../../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
  });

  const [open, setOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [dropdownLayout, setDropdownLayout] = useState(null);
  const [modalOptionsWidth, setModalOptionsWidth] = useState(null);
  const dropdownRef = useRef(null);

  // Reset selections when globalReset changes
  useEffect(() => {
    setSelectedOptions([]);
    if (onSelect) {
      onSelect([]);
    }
  }, [globalReset]);

  const toggleDropdown = () => {
    if (!open) {
      if (dropdownRef.current) {
        dropdownRef.current.measureInWindow((x, y, width, height) => {
          setDropdownLayout({ x, y, width, height });
          setOpen(true);
        });
      } else {
        setOpen(true);
      }
    } else {
      setOpen(false);
    }
  };

  const toggleSelection = (option) => {
    setSelectedOptions((prevSelected) => {
      let newSelected;
      if (prevSelected.some((o) => o.tagName === option.tagName)) {
        newSelected = prevSelected.filter((o) => o.tagName !== option.tagName);
      } else {
        newSelected = [...prevSelected, option];
      }
      if (onSelect) {
        onSelect(newSelected);
      }
      return newSelected;
    });
  };

  const label = getLabelForTagType(tagType);
  let displayText = placeholder;
  if (selectedOptions.length > 0) {
    displayText = `${label}: ${selectedOptions.length}`;
  } else {
    displayText = `${label}: `;
  }

  let adjustedLeft = dropdownLayout ? dropdownLayout.x : 0;
  if (dropdownLayout && modalOptionsWidth != null) {
    const screenWidth = Dimensions.get('window').width;
    const margin = 10; // Adjust margin as needed
    if (dropdownLayout.x + modalOptionsWidth > screenWidth) {
      adjustedLeft = screenWidth - modalOptionsWidth - margin;
      if (adjustedLeft < 0) {
        adjustedLeft = 0;
      }
    }
  }

  return (
    <View style={styles.dropdownContainer} ref={dropdownRef}>
      <Pressable
        style={[styles.dropdownHeader, selectedOptions.length > 0 && styles.selectedDropdownContainer]}
        onPress={toggleDropdown}
      >
        <Text style={styles.dropdownHeaderText}>{displayText}</Text>
        {open ? (
          <Entypo name="chevron-up" size={12} />
        ) : (
          <Entypo name="chevron-down" size={12} />
        )}
      </Pressable>
      {open && dropdownLayout && (
        <Modal transparent animationType="none">
          <Pressable style={styles.modalOverlay} activeOpacity={1} onPress={toggleDropdown}>
            <View
              style={[
                styles.dropdownOptions,
                {
                  position: 'absolute',
                  top: dropdownLayout.y + dropdownLayout.height + 6,
                  left: adjustedLeft,
                  alignSelf: 'flex-start',
                },
              ]}
              onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                setModalOptionsWidth(width);
              }}
            >
              <Text style={styles.optionsHeader}>Filter by {label}</Text>
              <Pressable
                style={styles.resetButton}
                onPress={() => {
                  setSelectedOptions([]);
                  if (onSelect) onSelect([]);
                }}
              >
                <Text style={styles.resetButtonText}>Clear filters</Text>
              </Pressable>
              {options.map((option, index) => {
                const isSelected = selectedOptions.some((o) => o.tagName === option.tagName);
                return (
                  <Pressable key={index} style={styles.dropdownOption} onPress={() => toggleSelection(option)}>
                    <Text style={styles.optionText}>
                      {option.tagIcon} {option.tagName}
                    </Text>
                    <View style={styles.checkbox}>
                      {isSelected && <Entypo name="check" size={12} color="black" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

export default Dropdown;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    marginBottom: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    height: 30,
    overflow: 'hidden',
    shadowColor: "darkgrey",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedDropdownContainer: {
    backgroundColor: buttonColor,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dropdownHeaderText: {
    fontSize: 12,
    fontFamily: MainFont,
    marginRight: 4,
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    minWidth: 160,
    borderRadius: 10,
    shadowColor: "darkgrey",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: 'lightgrey',
  },
  optionText: {
    fontSize: 12,
    fontFamily: MainFont,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsHeader: {
    fontFamily: MainFont_Bold,
    margin: 8,
  },
  resetButton: {
    paddingRight: 10,
    paddingBottom: 6,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: TextFontSize - 2,
    color: addButtonColor,
  },
});
