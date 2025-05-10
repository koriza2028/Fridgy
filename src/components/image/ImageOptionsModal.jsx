import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Static images with keys
const staticImageOptions = [
  { key: 'banana_test', source: require('../../../assets/ProductImages/banana_test.png') },
  { key: 'apple_test', source: require('../../../assets/ProductImages/apple_test.png') },
  { key: 'milk_test', source: require('../../../assets/ProductImages/milk_test.png') },
];

const ImageOptionsModal = ({ enableStaticImages, modalVisible, onSelect, onClose }) => {
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert('Permission Denied', 'You need to allow camera and gallery access.');
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri); // Send URI to upload
    }
  };

  const takePhoto = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      onSelect(result.assets[0].uri); // Send URI to upload
    }
  };

  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Choose an Image</Text>

          {/* Upload Options */}
          <View style={styles.uploadOptions}>
            <TouchableOpacity onPress={pickImageFromGallery} style={styles.uploadButton}>
              <Text style={styles.uploadText}>Pick from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhoto} style={styles.uploadButton}>
              <Text style={styles.uploadText}>Take a Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Static Images */}
          { enableStaticImages && 
          (<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staticImageScroll}>
            {staticImageOptions.map((img, index) => (
              <TouchableOpacity key={index} onPress={() => onSelect(img.key)} style={styles.imageBox}>
                <Image source={img.source} style={styles.imageThumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>)
          }

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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '85%',
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  uploadButton: {
    padding: 10,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  uploadText: {
    color: '#007BFF',
    fontWeight: '600',
  },
  staticImageScroll: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  imageBox: {
    marginHorizontal: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imageThumb: {
    width: 70,
    height: 70,
  },
  closeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  closeText: {
    color: '#007BFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ImageOptionsModal;
