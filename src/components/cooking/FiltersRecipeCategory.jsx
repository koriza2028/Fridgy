import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { MainFont, TextFontSize, addButtonColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';
import Dropdown from './Dropdown';

export default function FiltersRecipeCategory({ filterRules, onFilterChange }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  // State to trigger a reset on all dropdowns.
  const [globalResetCounter, setGlobalResetCounter] = useState(0);
  // Local state to store selected filters for each tagType.
  const [selectedFilters, setSelectedFilters] = useState({});

  // Group filterRules by tagType.
  const groupedOptions = filterRules.reduce((acc, curr) => {
    const { tagType } = curr;
    if (!acc[tagType]) {
      acc[tagType] = [];
    }
    acc[tagType].push(curr);
    return acc;
  }, {});

  // Handler when a dropdown selection changes.
  const handleDropdownChange = (tagType, selectedValues) => {
    const updatedFilters = { ...selectedFilters, [tagType]: selectedValues };
    setSelectedFilters(updatedFilters);
    // Flatten the object values into a single array of selected filter strings.
    const overallFilters = Object.values(updatedFilters).flat();
    onFilterChange(overallFilters);
  };

  // Handler to clear all filters.
  const handleGlobalReset = () => {
    setGlobalResetCounter(prev => prev + 1);
    setSelectedFilters({});
    onFilterChange([]);
  };

  return (
    <View style={styles.container}>
      {Object.keys(groupedOptions).map((tagType) => (
        <Dropdown
          key={tagType}
          tagType={tagType}
          options={groupedOptions[tagType]}
          globalReset={globalResetCounter}
          onSelect={(selected) => handleDropdownChange(tagType, selected)}
        />
      ))}
      <Pressable style={styles.globalResetButton} onPress={handleGlobalReset}>
        <Text style={styles.globalResetButtonText}>Clear filters</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
  },
  globalResetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    height: 30,
  },
  globalResetButtonText: {
    fontSize: TextFontSize,
    color: addButtonColor,
  },
});
