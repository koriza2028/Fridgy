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
  Dimensions,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AppImage from './AppImage';

const { width, height } = Dimensions.get('window');

// Static images with keys
const staticImageOptions = [
  { key: 'banana_test'},
  { key: 'apple_test'},
  { key: 'milk_test'},
  { key: 'banana_test'},
  { key: 'apple_test'},
  { key: 'milk_test'},
];

staticImageOptions.forEach((item) => {
  // Force decoding ahead of time (triggers load when app starts)
  Image.resolveAssetSource(item.source);
});

const MODAL_SIZE = width * 0.86;
const IMAGE_SIZE = MODAL_SIZE * 0.31; // or whatever size you want
const VERTICAL_SPACING = 10;

const StaticImageItem = React.memo(({ item, onSelect }) => {
  return (
    <TouchableOpacity onPress={() => onSelect(item.key)} style={styles.imageBox}>
      <AppImage
        staticImagePath={item.key}
        style={styles.imageThumb}
      />
    </TouchableOpacity>
  );
});

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
          {enableStaticImages && (
            <View style={{ height: IMAGE_SIZE * 4 + VERTICAL_SPACING * 4 + 15, alignItems: 'center' }}>
              <FlatList
                data={staticImageOptions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <StaticImageItem item={item} onSelect={onSelect} />
                )}
                numColumns={3}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={9}
                maxToRenderPerBatch={6}
                contentContainerStyle={{
                  paddingHorizontal: 0,
                }}
                columnWrapperStyle={{
                  justifyContent: 'flex-start', // ← this ensures rows start from the left
                }}
              />
            </View>
          )}

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
    width: MODAL_SIZE,
    padding: 12,
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
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    // margin: 5,
    // alignItems: 'start',
    // justifyContent: 'flex-start',
  },
  imageThumb: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    // borderRadius: 8,
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
