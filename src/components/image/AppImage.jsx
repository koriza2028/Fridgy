import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const staticImageMap = {
  //fruits
  'banana_test': require('../../../assets/ProductImages/banana_test.png'),
  'apple': require('../../../assets/ProductImages/fruits/apple_test.png'),
  'berries': require('../../../assets/ProductImages/fruits/berries.png'),
  'orange': require('../../../assets/ProductImages/fruits/orange.png'),
  'avocado': require('../../../assets/ProductImages/fruits/avocado.jpeg'),
  'grape': require('../../../assets/ProductImages/fruits/grape.jpeg'),
  'lemon': require('../../../assets/ProductImages/fruits/lemon.jpeg'),
  'lime': require('../../../assets/ProductImages/fruits/lime.jpeg'),
  'pear': require('../../../assets/ProductImages/fruits/pear.jpeg'),
  'pineapple': require('../../../assets/ProductImages/fruits/pineapple.png'),

  //vegetables
  'broccoli': require('../../../assets/ProductImages/vegetables/broccoli_anime.jpeg'),
  'cabbage': require('../../../assets/ProductImages/vegetables/cabbage.jpeg'),
  'carrot': require('../../../assets/ProductImages/vegetables/carrot.jpeg'),
  'garlic': require('../../../assets/ProductImages/vegetables/garlic.jpeg'),
  'lettuce': require('../../../assets/ProductImages/vegetables/lettuce.jpeg'),
  'onion': require('../../../assets/ProductImages/vegetables/onion.jpeg'),
  'pepper': require('../../../assets/ProductImages/vegetables/pepper.jpeg'),
  'pickle': require('../../../assets/ProductImages/vegetables/pickle.jpeg'),
  'potato_anime': require('../../../assets/ProductImages/vegetables/potato_anime.jpeg'),
  'tomato': require('../../../assets/ProductImages/vegetables/tomato.jpeg'),
  'zucchini': require('../../../assets/ProductImages/vegetables/zucchini.jpeg'),

  //drinks

  'milk': require('../../../assets/ProductImages/drinks/milk.png'),
  'juice': require('../../../assets/ProductImages/drinks/juice.jpeg'),
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
