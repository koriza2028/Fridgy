import React, { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Animated,
  Alert,
} from "react-native";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../firebaseConfig";
import ImageOptionsModal from "./image/ImageOptionsModal";
import AppImage from "./image/AppImage"; // Your reusable image renderer

const ImageWithUpload = React.memo(
  ({
    imageUri,
    staticImagePath,
    setImageUri,
    setStaticImagePath,
    animatedStyle,
    containerStyle,
    imageStyle,
    enableStaticImages = true, // <-- NEW
  }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const Wrapper = animatedStyle ? Animated.View : View;
    const combinedStyle = [styles.defaultContainer, containerStyle, animatedStyle];

    const handleUpload = useCallback(async (localUri) => {
      try {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const storage = getStorage(app);
        const fileRef = ref(storage, `recipeImages/${Date.now()}`);
        const metadata = {
          cacheControl: 'public,max-age=86400',
          contentType: blob.type || 'image/jpeg',
        };
        await uploadBytes(fileRef, blob, metadata);
        const downloadUrl = await getDownloadURL(fileRef);
        setImageUri(downloadUrl);
        if (setStaticImagePath) setStaticImagePath(null); // <-- Add safety check
      } catch (err) {
        console.error("Image upload failed:", err);
        Alert.alert("Upload Error", "Failed to upload image. Try again.");
      }
    }, [setImageUri, setStaticImagePath]);    

    const handleSelect = useCallback((selected) => {
      if (typeof selected === "string" && selected.startsWith("file://")) {
        handleUpload(selected);
      } else if (enableStaticImages) {
        setStaticImagePath(selected);
        setImageUri(null);
      }
      setModalVisible(false);
    }, [handleUpload, setImageUri, setStaticImagePath, enableStaticImages]);
  

    return (
      <View>
        <ImageOptionsModal
          enableStaticImages={enableStaticImages}
          modalVisible={modalVisible}
          onSelect={handleSelect}
          onClose={() => setModalVisible(false)}
        />

        <Wrapper style={combinedStyle}>
          <AppImage
            imageUri={imageUri}
            staticImagePath={staticImagePath}
            style={[styles.defaultImage, imageStyle]}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Pressable onPress={() => setModalVisible(true)} style={styles.uploadButton} />
        </Wrapper>
      </View>
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
