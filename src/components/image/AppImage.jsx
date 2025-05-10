import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const staticImageMap = {
  'banana_test': require('../../../assets/ProductImages/banana_test.png'),
  'apple_test': require('../../../assets/ProductImages/apple_test.png'),
  'milk_test': require('../../../assets/ProductImages/milk_test.png'),
};

const fallbackImage = staticImageMap['banana_test'];

export default function AppImage({
  imageUri,
  staticImagePath,
  style,
  contentFit = 'cover',
  cachePolicy = 'memory-disk',
}) {
  const source = useMemo(() => {
    if (imageUri?.startsWith('http') || imageUri?.startsWith('file://')) {
      return { uri: imageUri };
    }
    if (staticImagePath && staticImageMap[staticImagePath]) {
      return staticImageMap[staticImagePath];
    }
    return fallbackImage;
  }, [imageUri, staticImagePath]);

  return (
    <Image
      source={source}
      style={[styles.image, style]}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
