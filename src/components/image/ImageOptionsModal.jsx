import React, {useState} from 'react';
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

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePremiumStore } from '../../store/premiumStore';
import useAuthStore from '../../store/authStore';
import useFamilyStore from '../../store/familyStore';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Entypo from 'react-native-vector-icons/Entypo';
import { buttonColor } from '../../../assets/Styles/styleVariables';

import { FlashList } from '@shopify/flash-list';

import AppImage from './AppImage';
import SearchInput from '../Search';

import { useFonts } from 'expo-font';
import { backgroundColor, MainFont, MainFont_Bold, MainFont_SemiBold } from '../../../assets/Styles/styleVariables';

const { width, height } = Dimensions.get('window');

// Static images with keys
const staticImageOptions = [

  //fruits
  { key: 'apple'},
  { key: 'banana'},
  { key: 'orange'},
  { key: 'pineapple'},
  { key: 'berries'},
  { key: 'avocado'},
  { key: 'grape'},
  { key: 'lemon'},
  { key: 'lime'},
  { key: 'pear'},
  

  // vegetables
  { key: 'broccoli'},
  { key: 'cabbage'},
  { key: 'carrot'},
  { key: 'garlic'},
  { key: 'lettuce'},
  { key: 'onion'},
  { key: 'pepper'},
  { key: 'pickle'},
  { key: 'potatos'},
  { key: 'tomato'},
  { key: 'zucchini'},

  // drinks
{ key: 'milk' },
{ key: 'cola' },
{ key: 'icedTea' },
{ key: 'juiceOrange' },
{ key: 'lemonade' },

// meat
{ key: 'bacon' },
{ key: 'chicken' },
{ key: 'chickenPackaged' },
{ key: 'ham' },
{ key: 'meatballs' },
{ key: 'nuggets' },
{ key: 'steak' },
{ key: 'sausages' },
{ key: 'salmon' },
{ key: 'shrimps' },

// pasta
{ key: 'pasta1' },
{ key: 'pasta2' },
{ key: 'pasta3' },

// cheese
{ key: 'cheese' },
{ key: 'cheeseFeta' },
{ key: 'cheeseMozarella' },
{ key: 'cheeseParmesan' },
{ key: 'cheeseShredded' },
{ key: 'butter' },

// other
{ key: 'baguette' },
{ key: 'bread' },
{ key: 'egg' },
{ key: 'ketchup' },
{ key: 'mayonaise' },
{ key: 'rice' },
{ key: 'wraps' },
{ key: 'yogurtPink' },
{ key: 'yogurtWhite' },
{ key: 'olives' },
];

staticImageOptions.forEach((item) => {
  // Force decoding ahead of time (triggers load when app starts)
  Image.resolveAssetSource(item.source);
});

const MODAL_SIZE = width * 0.86;
const IMAGE_SIZE = MODAL_SIZE * 0.3; // or whatever size you want
// const VERTICAL_SPACING = 10;

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
  const [searchQuery, setSearchQuery] = useState('');

  const [fontsLoaded] = useFonts({
      'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
      'Inter-SemiBold': require('../../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

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

  const filteredStaticImages = staticImageOptions.filter((item) =>
    item.key.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const { familyId, user, lastUsedMode } = useAuthStore((s) => ({
    familyId: s.familyId,
    user: s.user,
    lastUsedMode: s.lastUsedMode,
  }));

  const navigation = useNavigation();
  const rcLoaded = usePremiumStore(s => s.rcLoaded);
  const rcActive = usePremiumStore((s) => s.isPremium);
  const { familyPremiumActive, familyPremiumLoaded, guardPauseUntil } = useFamilyStore(s => ({
    familyPremiumActive: s.familyPremiumActive,
    familyPremiumLoaded: s.familyPremiumLoaded,
    guardPauseUntil: s.guardPauseUntil,
  }));

  const grace = Date.now() < (guardPauseUntil || 0);

  const canUseFamilyMode =
    (!rcLoaded || !familyPremiumLoaded)
      ? undefined
      : (!!familyId && (rcActive || familyPremiumActive || grace));

  const onPressGallery = async () => {
    if (!canUseFamilyMode) {
      // onClose();
      // navigation.navigate('UserSettingsPage');
      return;
    }
    await pickImageFromGallery();
  };

  const onPressCamera = async () => {
    if (!canUseFamilyMode) {
      // onClose();
      // navigation.navigate('UserSettingsPage');
      return;
    }
    await takePhoto();
  };

  useFocusEffect(   
    React.useCallback(() => {
      if (!familyId) return;
      const noPremiumVisible = !rcActive && !familyPremiumActive;
      if (noPremiumVisible) {
        try {
          const s = useFamilyStore.getState();
          s.pauseGuard(12000); // 12s is plenty
          s.syncFamilyPremiumNow?.(familyId)?.catch(() => {});
        } catch {}
      }
     // no cleanup needed
    }, [familyId, rcActive, familyPremiumActive])
  );



  return (
    <Modal visible={modalVisible} animationType="fade" transparent>

      
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}> 

          <Text style={styles.title}>Choose an Image</Text>

          {/* Upload Options */}
          {/* <View style={styles.uploadOptions}>
            <TouchableOpacity onPress={pickImageFromGallery} style={styles.uploadButton}>
              <Text style={styles.uploadText}>Pick from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhoto} style={styles.uploadButton}>
              <Text style={styles.uploadText}>Take a Photo</Text>
            </TouchableOpacity>
          </View> */}

          <View style={styles.uploadOptions}>
            <TouchableOpacity style={[styles.uploadButton, !canUseFamilyMode && styles.uploadButtonLocked]}
              onPress={onPressGallery}
            >
              <Text style={styles.uploadText}>Pick from Gallery</Text>
              {!canUseFamilyMode && (
                <View style={styles.lockBadge}>
                  <MaterialIcons name="star" size={12} color="#fff" />
                  <Text style={styles.lockBadgeText}>Plus</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.uploadButton, !canUseFamilyMode && styles.uploadButtonLocked]}
              onPress={onPressCamera}
            >
              <Text style={styles.uploadText}>Take a Photo</Text>
              {!canUseFamilyMode && (
                <View style={styles.lockBadge}>
                  <MaterialIcons name="star" size={12} color="#fff" />
                  <Text style={styles.lockBadgeText}>Plus</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
   

          {/* Static Images */}
          {enableStaticImages && (
            <View style={styles.imageContainer}>
              <SearchInput placeholder={'Find a photo'} query={searchQuery} onChangeText={setSearchQuery} />
              {/* <FlashList */}
              <FlatList
                data={filteredStaticImages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <StaticImageItem item={item} onSelect={onSelect} />
                )}
                numColumns={3}
                scrollEnabled={true}
                showsVerticalScrollIndicator={false}
                initialNumToRender={9}
                maxToRenderPerBatch={6}
                // estimatedItemSize={100}
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
    backgroundColor: backgroundColor,
    width: MODAL_SIZE,
    paddingHorizontal: 10,
    paddingVertical: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    // paddingLeft: 6,
    fontFamily: MainFont_Bold,
    textAlign: 'center',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // marginBottom: 16,
    paddingHorizontal: 4,
  },
  uploadButton: {
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
  },
  uploadText: {
    color: '#007BFF',
    fontFamily: MainFont_SemiBold,
  },
  imageContainer: {
    height: IMAGE_SIZE * 3.5, 
    alignItems: 'center',
    marginTop: 4,
    // borderRadius: 6,
  },
  // staticImageScroll: {
  //   marginBottom: 20,
  //   paddingHorizontal: 4,
  // },
  imageBox: {
    // width: IMAGE_SIZE,
    // height: IMAGE_SIZE,
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
    fontFamily: MainFont_SemiBold,
  },

  uploadButton: {
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    width: '48%',
    alignItems: 'center',
    position: 'relative', // needed for the badge
  },
  uploadButtonLocked: {
    // opacity: 0.8,
  },
  lockBadge: {
    position: 'absolute',
    top: -6,
    right: 6,
    backgroundColor: buttonColor,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadgeText: {
    color: '#fff',
    fontFamily: MainFont_Bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },

});

export default ImageOptionsModal;
