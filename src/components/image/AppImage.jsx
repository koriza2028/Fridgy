import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const staticImageMap = {
  //fruits
  'banana_test': require('../../../assets/ProductImages/banana_test2.png'),
  'banana': require('../../../assets/ProductImages/fruits/banana.png'),
  'apple': require('../../../assets/ProductImages/fruits/apple.png'),
  'berries': require('../../../assets/ProductImages/fruits/berries.png'),
  'orange': require('../../../assets/ProductImages/fruits/orange.png'),
  'avocado': require('../../../assets/ProductImages/fruits/avocado.jpeg'),
  'grape': require('../../../assets/ProductImages/fruits/grapes.png'),
  'lemon': require('../../../assets/ProductImages/fruits/lemon.jpeg'),
  'lime': require('../../../assets/ProductImages/fruits/lime.jpeg'),
  'pear': require('../../../assets/ProductImages/fruits/pear.jpeg'),
  'pineapple': require('../../../assets/ProductImages/fruits/pineapple.png'),

  //vegetables
  'broccoli': require('../../../assets/ProductImages/vegetables/broccoli.png'),
  'cabbage': require('../../../assets/ProductImages/vegetables/cabbage.jpeg'),
  'carrot': require('../../../assets/ProductImages/vegetables/carrot.jpeg'),
  'garlic': require('../../../assets/ProductImages/vegetables/garlic.jpeg'),
  'lettuce': require('../../../assets/ProductImages/vegetables/lettuce.jpeg'),
  'onion': require('../../../assets/ProductImages/vegetables/onion.jpeg'),
  'pepper': require('../../../assets/ProductImages/vegetables/pepper.jpeg'),
  'pickle': require('../../../assets/ProductImages/vegetables/pickle.jpeg'),
  'potatos': require('../../../assets/ProductImages/vegetables/potatos.png'),
  'tomato': require('../../../assets/ProductImages/vegetables/tomato.jpeg'),
  'zucchini': require('../../../assets/ProductImages/vegetables/zucchini.jpeg'),

  //drinks

  'milk': require('../../../assets/ProductImages/drinks/milk.png'),
  'cola': require('../../../assets/ProductImages/drinks/cola.png'),
  'icedTea': require('../../../assets/ProductImages/drinks/icedTea.png'),
  'juiceOrange': require('../../../assets/ProductImages/drinks/juiceOrange.png'),
  'lemonade': require('../../../assets/ProductImages/drinks/lemonade.png'),

  // meat

  'bacon': require('../../../assets/ProductImages/meat/bacon.png'),
  'chicken': require('../../../assets/ProductImages/meat/chicken.png'),
  'chickenPackaged': require('../../../assets/ProductImages/meat/chickenPackaged.png'),
  'ham': require('../../../assets/ProductImages/meat/ham.png'),
  'meatballs': require('../../../assets/ProductImages/meat/meatballs.png'),
  'nuggets': require('../../../assets/ProductImages/meat/nuggets.png'),
  'steak': require('../../../assets/ProductImages/meat/steak.png'),
  'sausages': require('../../../assets/ProductImages/meat/sausages.png'),
  'salmon': require('../../../assets/ProductImages/meat/salmon.png'),
  'shrimps': require('../../../assets/ProductImages/meat/shrimps.png'),

  // pasta
  
  'pasta1': require('../../../assets/ProductImages/pasta/pasta1.png'),
  'pasta2': require('../../../assets/ProductImages/pasta/pasta2.png'),
  'pasta3': require('../../../assets/ProductImages/pasta/pasta3.png'),

  // cheese

  'cheese': require('../../../assets/ProductImages/cheese/cheese.png'),
  'cheeseFeta': require('../../../assets/ProductImages/cheese/cheeseFeta.png'),
  'cheeseMozarella': require('../../../assets/ProductImages/cheese/cheeseMozarella.png'),
  'cheeseParmesan': require('../../../assets/ProductImages/cheese/cheeseParmesan.png'),
  'cheeseShredded': require('../../../assets/ProductImages/cheese/cheeseShredded.png'),
  'butter': require('../../../assets/ProductImages/cheese/butter.png'),

  // other

  'baguette': require('../../../assets/ProductImages/other/baguette.png'),
  'bread': require('../../../assets/ProductImages/other/bread.png'),
  'egg': require('../../../assets/ProductImages/other/egg.png'),
  'ketchup': require('../../../assets/ProductImages/other/ketchup.png'),
  'mayonaise': require('../../../assets/ProductImages/other/mayo.png'),
  'rice': require('../../../assets/ProductImages/other/rice.png'),
  'wraps': require('../../../assets/ProductImages/other/wraps.png'),
  'yogurtPink': require('../../../assets/ProductImages/other/yogurtPink.png'),
  'yogurtWhite': require('../../../assets/ProductImages/other/yogurtWhite.png'),
  'olives': require('../../../assets/ProductImages/other/olives.png'),
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
