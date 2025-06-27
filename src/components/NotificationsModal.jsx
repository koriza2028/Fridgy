import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import useNotificationsStore from '../store/notificationsStore';
import IngredientItem from '../components/cooking/IngredientCard';

import { useFonts } from 'expo-font';
import { addButtonColor, backgroundColor, buttonColor, MainFont, MainFont_Bold, TextFontSize } from '../../assets/Styles/styleVariables';

const NotificationsModal = ({ isVisible, onClose }) => {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });
  
  const { groupedMissingIngredients, loading: isLoading } = useNotificationsStore();

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInDown"
      animationOut="slideOutUp"
      animationInTiming={300}
      animationOutTiming={300}
      style={styles.modal}
      backdropOpacity={0.4}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <Pressable style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={28} color="black" />
        </Pressable>

        {/* Title */}
        <Text style={styles.title}>Notifications</Text>

        {/* Ingredient List */}
        <View style={styles.requiredIngredients}>
          {isLoading ? (
            <Text>Loading...</Text>
          ) : (
            Object.entries(groupedMissingIngredients).map(([date, recipeMap]) => {
              const recipesWithMissing = Object.entries(recipeMap);
              if (recipesWithMissing.length === 0) return null;

              return (
                <View key={date} style={{ marginBottom: 20 }}>
                  <Text style={styles.dateHeader}>
                    {new Date(date).toLocaleDateString('de-DE')}:
                  </Text>
                  {recipesWithMissing.map(([recipeId, { title, ingredients }]) => (
                    <View key={recipeId} style={styles.recipeBlock}>
                      <Text style={styles.recipeTitle}>{title}</Text>
                      {ingredients.map((ingredient, index) => (
                        <IngredientItem
                          key={`${recipeId}-${ingredient.productId}-${index}`}
                          ingredient={ingredient}
                          isAvailable={false}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              );
            })
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: MainFont_Bold,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 64,
    right: 14,
    zIndex: 10,
  },
  requiredIngredients: {
    marginTop: 20,
  },
  dateHeader: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  recipeBlock: {
    marginLeft: 10,
    marginBottom: 10,
  },
  recipeTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
});

export default NotificationsModal;
