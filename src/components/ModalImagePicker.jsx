import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';


const ImageOptionsModal = ({ modalVisible, imageOptions, onSelect, onClose }) => {
  
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow camera and gallery access.');
      return false;
    }
    return true;
  };

  // Pick an image from the gallery
  const pickImageFromGallery = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri); // Send the image URI to the parent component
    }
  };

  // Take a photo using the camera
  const takePhoto = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri); // Send the image URI to the parent component
    }
  };

  // Get image source for both static and uploaded images
  const getImageSource = (imageName) => {
    if (typeof imageName === 'string' && imageName.startsWith('file://')) {
      return { uri: imageName }; // Handle dynamic images
    }
    const images = {
      '../../../assets/ProductImages/banana_test.png': require('../../assets/ProductImages/banana_test.png'),
      '../../../assets/ProductImages/apple_test.png': require('../../assets/ProductImages/apple_test.png'),
      '../../../assets/ProductImages/milk_test.png': require('../../assets/ProductImages/milk_test.png'),
    };

    return images[imageName] || require('../../assets/ProductImages/banana_test.png'); // Default fallback
  };

  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Choose an Image</Text>

          {/* Upload Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={pickImageFromGallery} style={styles.optionImageContainer}>
              <Text style={styles.uploadText}>Pick from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhoto} style={styles.optionImageContainer}>
              <Text style={styles.uploadText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Static Image Options */}
          <View style={styles.optionsContainer}>
            {imageOptions.map((option, index) => (
              <TouchableOpacity key={index} onPress={() => onSelect(option)} style={styles.optionContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={getImageSource(option)} style={styles.optionImage} resizeMode="cover" />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
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

export default ImageOptionsModal;