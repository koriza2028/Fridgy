import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';

import Modal from "react-native-modal";
import { BlurView } from 'expo-blur';
import { backgroundColor } from '../../assets/Styles/styleVariables';
const ModalImagePicker = ({ modalVisible, imageOptions, onSelect, onClose, pickImageFromDevice }) => {


  return (

    <Modal visible={modalVisible} animationType="fade" onBackdropPress={onClose} backdropColor="black" backdropOpacity={0.5} style={{ margin: 10 }}>
      <BlurView intensity={0} style={styles.blurContainer}>
      <View style={styles.modalContainer}>

        <View style={styles.modalContent}>

          <Text style={styles.title}>Choose an Image</Text>
          <View style={styles.optionsContainer}>

            <Pressable onPress={pickImageFromDevice} style={styles.optionImageContainer}>
              <Text style={styles.uploadText}>Upload Image</Text>
            </Pressable>

            {imageOptions.map((option, index) => (
              <Pressable key={index} onPress={() => onSelect(option)} style={styles.optionContainer}>
                <View style={styles.imageWrapper}>
                    <Image source={option} style={styles.optionImage} resizeMode="cover" />
                </View>
              </Pressable>
            ))}
            
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({

  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: backgroundColor,
    // backgroundColor: 'rgba(255, 255, 255, 0)',
    borderColor: '#C0C0C0',
    // borderWidth: 1,
    borderRadius: 10,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: backgroundColor,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    // borderWidth: 1,
    shadowColor: '#C0C0C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    // gap: 5,
    // borderWidth: 1,
    // borderColor: '#000',
  },
  optionContainer: {
    width: '33%', // This container takes one-third of the parent's width.
  },
  imageWrapper: {
    width: '100%', // The wrapper fills the container's width.
    aspectRatio: 1, // Ensures the wrapper is a square.
  },
  optionImage: {
    width: '100%',  // Force the image to fill the wrapper.
    height: '100%', // Force the image to fill the wrapper.
  },
  optionImageContainer: {
    width: '33%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  uploadText: {
    textAlign: 'center',
    color: '#007BFF',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeText: {
    color: '#007BFF',
    fontSize: 16,
  },
});

export default ModalImagePicker;