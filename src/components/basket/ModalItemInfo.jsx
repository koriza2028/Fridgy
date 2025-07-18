import React, {useState, useEffect, useRef} from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Easing } from "react-native";
import { Image } from 'expo-image';
import Modal from "react-native-modal";


const { width, height } = Dimensions.get('window');
import { useFonts } from 'expo-font';
import { greyTextColor, greyTextColor2, MainFont, MainFont_Bold, MainFont_SemiBold, MainFont_Title, SecondTitleFontSize, TextFontSize } from "../../../assets/Styles/styleVariables";
import AppImage from "../image/AppImage";

const ModalItemInfo = ({ isVisible, onClose, selectedProduct }) => {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'), 
      'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const [title, setTitle] = useState(selectedProduct?.name || "");

  useEffect(() => {
    setTitle(selectedProduct?.name || "");
  }, [selectedProduct?.name]);

  onModalClose = () => { 
    // setTitle(selectedProduct?.name);
    onClose();
  }

const [showContent, setShowContent] = useState(false);
const opacity = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (isVisible) {
    setShowContent(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    }).start();
  } else {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowContent(false); // hide content AFTER fade out
    });
  }
}, [isVisible]);


  return (
    <Modal 
      isVisible={isVisible} 
      // onSwipeComplete={onModalClose} 
      // swipeDirection="down"
      backdropColor="black" backdropOpacity={0.5} onBackdropPress={onModalClose}
      style={styles.modal}
      // animationIn="slideInUp"
      // animationOut="slideOutDown"
      hideModalContentWhileAnimating={true}
      animationInTiming={400}
      animationOutTiming={300}
      useNativeDriver={true} 
      useNativeDriverForBackdrop={true}
      // backdropTransitionInTiming={800}
      // backdropTransitionOutTiming={300}
    >
      {showContent && (
      <Animated.View style={[styles.modalContainer]} >
            <View style={styles.container}>      
         
         <AppImage
          style={styles.productImage}
          imageUri={selectedProduct?.imageUri}
          staticImagePath={selectedProduct?.staticImagePath}
        />
        <Text style={styles.productName}>{selectedProduct?.name}</Text>
        <Text style={styles.productNotes}>{selectedProduct?.notes}</Text>
            
      </View>
    </Animated.View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
    modal: {
        justifyContent: "flex-end", 
        margin: 0,
    },
    container: {
        // flex: 1,
        // justifyContent: 'center',
        // alignItems: 'center',
        backgroundColor: 'white',
        // padding: 20, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16,
        minHeight: 200,
    },
    productImage: {
        width: width,
        height: width,
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16,
    },
    productName: {
      fontFamily: MainFont_Title,
      fontSize: SecondTitleFontSize,
      fontSize: 24,
      paddingHorizontal: 20,
      marginVertical: 10,
    },
    yourNotes: {
      fontFamily: MainFont_SemiBold,
      fontSize: SecondTitleFontSize,
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    productNotes: {
      fontFamily: MainFont,
      fontSize: TextFontSize,
      color: greyTextColor2,
      paddingHorizontal: 20,
      paddingBottom: 20,
      minHeight: 100,
      maxHeight: 150,
      overflow: 'hidden',
    }

});

export default ModalItemInfo;