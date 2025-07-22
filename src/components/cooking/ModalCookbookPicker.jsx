import React, {useState} from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Modal from 'react-native-modal';

import { useFonts } from 'expo-font';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const initialCategories = [
  'Breakfast',
  'Dessert',
  'Dinner',
  'Grilling',
  'Indian',
  'Italian',
  'Lunch',
  'Mexican',
  'Snacks',
  'Vegan',
].sort();

const getRandomOffset = () => ({
  translateX: Math.floor(Math.random() * 20 - 10),
  translateY: Math.floor(Math.random() * 10 - 5),
  rotate: `${Math.floor(Math.random() * 4 - 2)}deg`,
});

const { width } = Dimensions.get('window');

export default function CookbookPickerModal({ isVisible, onClose }) {

    const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    const [categories, setCategories] = useState(initialCategories);
    const [newCategory, setNewCategory] = useState('');

    const addCategory = () => {
        const trimmed = newCategory.trim();
        if (trimmed && !categories.includes(trimmed)) {
        setCategories(prev => [...prev, trimmed].sort());
        }
        setNewCategory('');
    };
      
    return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        {/* Input Row */}
        <View style={styles.inputWrapper}>
            <TextInput
                placeholder="Add new category"
                value={newCategory}
                onChangeText={setNewCategory}
                style={styles.textInput}
                placeholderTextColor="#999"
            />
            {newCategory.length > 0 && (
                <Pressable
                    style={styles.clearButton}
                    onPress={() => setNewCategory('')}
                >
                <MaterialIcons name="close" size={18} color="#555" />
                </Pressable>
            )}
            </View>

            <TouchableOpacity onPress={addCategory} style={styles.addCategoryTextBtn}>
            <Text style={styles.addCategoryText}>Add Category</Text>
            </TouchableOpacity>

        {/* Category Grid */}
        <ScrollView contentContainerStyle={styles.CookbookFilter}>
          {categories.map((category, index) => {
            const offset = getRandomOffset();
            return (
              <TouchableOpacity
                key={index}
                style={[
                    styles.CookbookFilterCategory,
                    {
                    transform: [
                        { translateX: offset.translateX },
                        { translateY: offset.translateY },
                        { rotate: offset.rotate },
                    ],
                    },
                ]}
                onPress={() => console.log(`Pressed ${category}`)}
                >
                <Text style={styles.CookbookFilterCategory_Text}>{category}</Text>
                </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Close Button */}
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );

}



const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  textInput: {
    width: '100%',
  paddingVertical: 10, // increased height
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  fontSize: 14,
  color: '#000',
  paddingRight: 30,
},
  inputWrapper: {
    position: 'relative',
},
clearButton: {
  position: 'absolute',
  right: 8,
  top: '50%',
  transform: [{ translateY: -9 }],
  padding: 4,
},
addCategoryTextBtn: {
  alignSelf: 'flex-start',
//   paddingVertical: 6,
  paddingLeft: 4,
  marginBottom: 10,
  marginTop: 8,
},
addCategoryText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#007AFF',
},
  addButton: {
    marginLeft: 8,
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
  },
  CookbookFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  CookbookFilterCategory: {
    margin: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'white',
  },
  CookbookFilterCategory_Text: {
    fontFamily: 'System', // Replace with MainFont
    fontSize: 14,         // Replace with TextFontSize
  },
  closeButton: {
    marginTop: 10,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
});