import React, { useMemo } from "react";
import { View, Animated, Pressable, Dimensions } from "react-native";
const { width } = Dimensions.get("window");

const HeaderImage = React.memo(({ localImageUri, imageUri, handleImageUpload, scrollA }) => {
  const imageStyle = useMemo(() => ({
    width: width,
    height: width,
    transform: [
      { translateY: scrollA },
      {
        scale: scrollA.interpolate({
          inputRange: [-width, 0, width],
          outputRange: [2, 1, 1],
        }),
      },
    ],
  }), [scrollA]);

  return (
    <View>
      <Animated.Image 
        style={imageStyle}
        source={
          localImageUri
            ? { uri: localImageUri }
            : imageUri
              ? { uri: imageUri }
              : require('../../../assets/ProductImages/banana_test.png')
        }
        resizeMode="cover"
      />
      <Pressable onPress={handleImageUpload} style={styles.ProductPicture_Button} />
    </View>
  );
});

export default HeaderImage;

