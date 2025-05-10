import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Modal from 'react-native-modal';
import { BlurView } from 'expo-blur';

import { buttonColor, backgroundColor, addButtonColor, 
      MainFont, MainFont_Bold, TextFontSize, MainFont_Title, SecondTitleFontSize, ReceiptFont, 
      whiteTextColor } from '../../../assets/Styles/styleVariables';
import { useFonts } from 'expo-font';

export default function ModalProductCategoryPicker({
  categories,
  alreadySelectedCategories = [],
  alreadySelectedCategory = null,
  isCategoryModalVisible,
  setIsCategoryModalVisible,
  onClose,
  onCategorySelect,
  multiSelect = false
}) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    'Inter-Title': require('../../../assets/fonts/Inter/Inter_24pt-Bold.ttf'),
  });

  const [selectedCategory, setSelectedCategory] = useState(alreadySelectedCategory);
  const [selectedCategories, setSelectedCategories] = useState(alreadySelectedCategories);

  useEffect(() => {
      setSelectedCategory(alreadySelectedCategory);
  }, [alreadySelectedCategory]);

  const handleCategoryOptionSelect = (selectedTag) => {
    if (multiSelect) {
      setSelectedCategories((prevSelected) => {
        const isAlreadySelected = prevSelected.some(tag => {
          tag.tagName === selectedTag.tagName
      });
        
        if (isAlreadySelected) {
          return prevSelected.filter(tag => tag.tagName !== selectedTag.tagName);
        } else {
          // Remove any previously selected tag with the same tagType and add the new one
          const filteredSelection = prevSelected.filter(tag => tag.tagType !== selectedTag.tagType);
          return [...filteredSelection, selectedTag];
        }
      });
    } else {
      setSelectedCategory(selectedTag);
      onCategorySelect(selectedTag);
      setIsCategoryModalVisible(false);
    }
  };

  const handleConfirmSelection = () => {
    onCategorySelect(selectedCategories);
    setIsCategoryModalVisible(false);
  };

  const groupedCategories = categories.reduce((acc, category) => {
    if (!acc[category.tagType]) acc[category.tagType] = [];
    acc[category.tagType].push(category);
    return acc;
  }, {});

  return (
    <Modal isVisible={isCategoryModalVisible} style={styles.modal} backdropColor="darkgrey" backdropOpacity={0.2} >
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>X</Text>
      </Pressable>

      <BlurView intensity={70} style={styles.blurContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{multiSelect ? "Select tags for your recipe" : "Choose the category"}</Text>

          <View style={styles.categoryGroup_Wrapper}>
            {Object.entries(groupedCategories).map(([tagType, tags]) => (
              <View key={tagType} style={styles.categoryGroup}>
                {tags.map((category, index) => (
                  <Pressable
                    key={category.tagName}
                    index={index}
                    style={[styles.CategoryPickerOption, 
                      multiSelect && selectedCategories.some(tag => tag.tagName === category.tagName) ? styles.CategoryPickerOptionSelected : null,
                      !multiSelect && selectedCategory?.tagName === category.tagName ? styles.CategoryPickerOptionSelected : null
                    ]}
                    onPress={() => handleCategoryOptionSelect(category)}>

                    <Text style={[styles.Text_CategoryPickerOptionIcon, 
                      multiSelect && selectedCategories.some(tag => tag.tagName === category.tagName) ? styles.Text_CategoryPickerOptionIconSelected : null,
                      !multiSelect && selectedCategory?.tagName === category.tagName ? styles.Text_CategoryPickerOptionIconSelected : null
                    ]}>
                      {category.tagIcon}
                    </Text>

                    <Text style={[styles.Text_CategoryPickerOption,
                      multiSelect && selectedCategories.some(tag => tag.tagName === category.tagName) ? styles.Text_CategoryPickerOptionSelected : null,
                      !multiSelect && selectedCategory?.tagName === category.tagName ? styles.Text_CategoryPickerOptionSelected : null
                    ]}>
                      {category.tagName}
                    </Text>

                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {multiSelect && (
            <Pressable style={styles.confirmButton} onPress={handleConfirmSelection}>
              <Text style={styles.confirmButtonText}>Confirm selection</Text>
            </Pressable>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({

  modal: {
      justifyContent: 'flex-end', 
      margin: 0, 
    },
    blurContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: 'rgba(100, 100, 100, 0.8)',
      flex: 1,
      padding: 20,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      width: '100%',
    },
    modalTitle: {
      marginBottom: 10,
      marginTop: 40,
      borderBottomWidth: 1,
      borderColor: '#eee',
      width: '100%',
      textAlign: 'center',
      paddingBottom: 6,
      fontFamily: ReceiptFont,
      fontSize: SecondTitleFontSize + 2,
      color: whiteTextColor,
      fontWeight: 700,
    },
    categoryGroup_Wrapper: {
      // borderColor: '#C0C0C0',
      // borderWidth: 1,
      width: '100%',
    },
    categoryGroup: {
      // borderColor: '#C0C0C0',
      // borderWidth: 1,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      gap: '3%',
    },
    CategoryPickerOption: {
      // height: 50,
      padding: 10,
      borderRadius: 60,
      marginVertical: 5,
      // backgroundColor: '#f0f0f0',
      width: '30%',
      alignItems: 'center',
      justifyContent: 'center',
    },

    Text_CategoryPickerOptionIcon: {
      fontSize: TextFontSize + 6,
      marginBottom: 4,
      borderRadius: 60,
      padding: 10,
      backgroundColor: backgroundColor,
      // PICK A BETTER COLOR FOR IT
    },

    Text_CategoryPickerOptionIconSelected: {
      backgroundColor: 'transparent',
      // PICK A BETTER COLOR FOR IT
    },

    Text_CategoryPickerOption: {
      fontSize: TextFontSize - 2,
      fontFamily: MainFont,
      color: whiteTextColor,
    },

    CategoryPickerOptionSelected: {
      // backgroundColor: '#cce5ff',
      backgroundColor: backgroundColor
    },

    Text_CategoryPickerOptionSelected: {
      fontWeight: 'bold',
      color: '#0056b3',
    },
    confirmButton: {
      // marginTop: 20,
      // marginLeft: '6%',
      position: 'absolute',
      bottom: '5%',
      right: '5%',
      padding: 10,
      width: '90%',
      borderRadius: 60,
      backgroundColor: addButtonColor,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },


    closeButton: {
      position: 'absolute',
      top: 56,
      right: 20,
      zIndex: 10,
    },
    closeButtonText: {
      fontSize: 22,
      color: 'white',
      fontWeight: 'bold',
    },
})