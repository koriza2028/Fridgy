import React from 'react';
import { View, StyleSheet, Text, Pressable, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';

const UserOptionsModal = ({ isVisible, onClose, onViewProfile}) => {
  const navigation = useNavigation();

  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              logout();
              // onLogout();
              navigation.navigate('Login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };


    return (
      <Modal
        isVisible={isVisible}
        onBackdropPress={onClose}
        backdropOpacity={0.3}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={styles.modal}
      >
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem} 
            onPress={() => {
              onClose(); // close modal first
              navigation.navigate('UserSettingsPage');
            }}>
            <MaterialIcons name="person-outline" size={20} style={styles.icon} />
            <Text style={styles.menuText}>View Profile</Text>
          </Pressable>
  
          <Pressable style={styles.menuItem} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} style={styles.icon} />
            <Text style={styles.menuText}>Logout</Text>
          </Pressable>
        </View>
      </Modal>
    );
  };
  
  const styles = StyleSheet.create({
    modal: {
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      margin: 0,
      paddingTop: 100,
      paddingRight: 8,
    },
    menuContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingVertical: 6,
      width: 220,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    menuText: {
      fontSize: 16,
      marginLeft: 10,
    },
    icon: {
      color: '#333',
    },
  });
  

export default UserOptionsModal;