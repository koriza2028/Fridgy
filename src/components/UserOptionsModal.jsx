import React from 'react';
import { View, StyleSheet, Text, Pressable, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import ButtonBouncing from './Button_Bouncing';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';

import { useFonts } from 'expo-font';
import { addButtonColor, backgroundColor, buttonColor, MainFont, MainFont_Bold, TextFontSize } from '../../assets/Styles/styleVariables';

const UserOptionsModal = ({ isVisible, onClose, onViewProfile}) => {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });
  
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

          <ButtonBouncing 
            onPress={() => {
              onClose(); // close modal first
              navigation.navigate('UserSettingsPage');
            }}

            style={{borderRadius: 8, borderBottomLeftRadius: 0, borderBottomRightRadius: 0}}
          
            label={
              <View style={styles.menuItem}>
                <MaterialIcons name="person-outline" size={20} style={styles.icon} />
                <Text style={styles.menuText}>Premium Features</Text>
              </View>
            } toScale={1}
          />

          <ButtonBouncing 
            onPress={handleLogout}

            style={{borderRadius: 8, borderTopLeftRadius: 0, borderTopRightRadius: 0}}

            label={
              <View style={styles.menuItem}>
                <MaterialIcons name="logout" size={20} style={styles.icon} />
                <Text style={styles.menuText}>Logout</Text>
              </View>} toScale={1}
          />

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
      // paddingVertical: 6,
      width: 200,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    menuText: {
      fontSize: TextFontSize,
      fontFamily: MainFont,
      marginLeft: 8,
    },
    icon: {
      color: '#333',
      fontSize: 24,
    },
  });
  

export default UserOptionsModal;