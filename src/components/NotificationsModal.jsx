import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import useNotificationsStore from '../store/notificationsStore';
import IngredientItem from '../components/cooking/IngredientCard';

const NotificationsModal = ({ isVisible, onClose }) => {
  const { groupedMissingIngredients, loading: isLoading } = useNotificationsStore();

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
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
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 10,
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
