// components/ImageWithUpload.js
import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Animated,
  ScrollView,
  Alert,
  Text,
} from "react-native";
import { Image } from 'expo-image';
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Asset } from 'expo-asset';
import app from "../firebaseConfig";

// Default placeholder (bundled local asset)
const defaultPlaceholder = require("../../assets/ProductImages/banana_test.png");

// Static assets (bundled) and remote URLs
const localStaticAssets = [
  require("../../assets/ProductImages/banana_test.png"),
  // Add more local assets here
];
const remoteStaticUrls = [
  "https://firebasestorage.googleapis.com/v0/b/fridgy-5cb04.firebasestorage.app/o/recipeImages%2F1744814320283?alt=media&token=75bde320-43d9-4e02-90b6-690e4e632fcc",
  // Add more remote URLs here
];

const ImageWithUpload = React.memo(
  ({
    imageUri,
    animatedStyle,
    containerStyle,
    imageStyle,
    setImageUri,
  }) => {
    const [staticList, setStaticList] = useState([]);
    const [staticVisible, setStaticVisible] = useState(false);

    useEffect(() => {
      // Resolve local requires to URIs
      const resolvedLocal = localStaticAssets.map(asset => Asset.fromModule(asset).uri);
      setStaticList([...resolvedLocal, ...remoteStaticUrls]);
    }, []);

    // Always treat imageUri as a string URI
    const memoizedSource = useMemo(() => {
      if (imageUri) {
        return { uri: imageUri };
      }
      return defaultPlaceholder;
    }, [imageUri]);

    // Animated wrapper if needed
    const Wrapper = animatedStyle ? Animated.View : View;
    const combinedStyle = [styles.defaultContainer, containerStyle, animatedStyle];

    // Handle upload (paid)
    const handleImageUpload = useCallback(async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.5,
        });
        if (!result.canceled) {
          const uri = result.assets[0].uri;
          const response = await fetch(uri);
          const blob = await response.blob();
          const storage = getStorage(app);
          const storageRef = ref(storage, `recipeImages/${Date.now()}`);
          const metadata = { cacheControl: 'public,max-age=86400', contentType: blob.type || 'image/jpeg' };
          await uploadBytes(storageRef, blob, metadata);
          const downloadUrl = await getDownloadURL(storageRef);
          setImageUri(downloadUrl);
          setStaticVisible(false);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        Alert.alert("Error", "Failed to upload image. Please try again.");
      }
    }, [setImageUri]);

    // Select a static image
    const handleSelectStatic = useCallback((uri) => {
      setImageUri(uri);
      setStaticVisible(false);
    }, [setImageUri]);

    // Show action menu
    const handlePress = useCallback(() => {
      Alert.alert(
        "Select Image",
        "Choose an option",
        [
          { text: "Static Images", onPress: () => setStaticVisible(true) },
          { text: "Upload Image", onPress: handleImageUpload },
          { text: "Cancel", style: 'cancel' },
        ],
        { cancelable: true }
      );
    }, [handleImageUpload]);

    return (
      <View>
        {staticVisible && (
          <ScrollView horizontal contentContainerStyle={styles.staticContainer} showsHorizontalScrollIndicator={false}>
            {staticList.map((uri, idx) => (
              <Pressable key={idx} onPress={() => handleSelectStatic(uri)} style={styles.staticThumbWrapper}>
                <Image source={{ uri }} style={styles.staticImage} contentFit="cover" />
              </Pressable>
            ))}
            <Pressable onPress={() => setStaticVisible(false)} style={styles.staticThumbWrapper}>
              <View style={[styles.staticImage, styles.cancelThumb]}>
                <Text style={styles.cancelText}>Cancel</Text>
              </View>
            </Pressable>
          </ScrollView>
        )}

        <Wrapper style={combinedStyle}>
          <Image source={memoizedSource} style={[styles.defaultImage, imageStyle]} contentFit="cover" cachePolicy="memory-disk" />
          <Pressable onPress={handlePress} style={styles.uploadButton} />
        </Wrapper>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  defaultContainer: { width: "100%", aspectRatio: 1, overflow: "hidden", borderRadius: 16 },
  defaultImage: { width: "100%", height: "100%" },
  uploadButton: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  staticContainer: { paddingHorizontal: 8, paddingVertical: 4 },
  staticThumbWrapper: { marginRight: 8, borderRadius: 8, overflow: 'hidden' },
  staticImage: { width: 60, height: 60 },
  cancelThumb: { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 12, color: '#333' },
});

export default ImageWithUpload;
