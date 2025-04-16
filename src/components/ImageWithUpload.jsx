// components/ImageWithUpload.js
import React, { useMemo, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { Image } from 'expo-image';
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../firebaseConfig";

const defaultPlaceholder = require("../../assets/ProductImages/banana_test.png");

const ImageWithUpload = React.memo(
  ({
    imageUri,
    animatedStyle,
    containerStyle,
    imageStyle,
    setImageUri,
  }) => {

    const memoizedSource = useMemo(() => {
      return imageUri ? { uri: imageUri } : defaultPlaceholder;
    }, [imageUri]);

    // Use Animated.View if an animatedStyle is provided; otherwise use a regular View.
    const Wrapper = animatedStyle ? Animated.View : View;
    const combinedStyle = [styles.defaultContainer, containerStyle, animatedStyle];


      // Wrap handleImageUpload so its identity is stable.
      const handleImageUpload = useCallback(async () => {
        try {
          let result = await ImagePicker.launchImageLibraryAsync({
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
            const storageRef = ref(storage, `recipeImages/${new Date().getTime()}`);
            const metadata = {
              cacheControl: 'public,max-age=86400', // cache for 1 day
              contentType: blob.type || 'image/jpeg',
            };
      
            await uploadBytes(storageRef, blob, metadata);
    
            const downloadUrl = await getDownloadURL(storageRef);
            setImageUri(downloadUrl);
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          Alert.alert("Error", "Failed to upload image. Please try again.");
        }
      }, []);

    return (
      <Wrapper style={combinedStyle}>
        <Image
          source={memoizedSource}
          style={[styles.defaultImage, imageStyle]}
          contentFit="cover"
          cachePolicy="memory-disk" // or "disk", "immutable", etc.
        />
        {handleImageUpload && (
          <Pressable onPress={handleImageUpload} style={styles.uploadButton} />
        )}
      </Wrapper>
    );
  }
);

const styles = StyleSheet.create({
  defaultContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 16,
  },
  defaultImage: {
    width: "100%",
    height: "100%",
  },
  uploadButton: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});

export default ImageWithUpload;
