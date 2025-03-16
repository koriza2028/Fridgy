import React, {useState, useEffect} from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import Modal from "react-native-modal";

import { useFonts } from 'expo-font';
import { MainFont, SecondTitleFontSize, TextFontSize } from "../../../assets/Styles/styleVariables";

const ModalItemInfo = ({ isVisible, onClose, selectedProduct, onChangeName}) => {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'), 
      'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const [title, setTitle] = useState(selectedProduct?.name || "");

  useEffect(() => {
    setTitle(selectedProduct?.name || "");
  }, [selectedProduct?.name]);

  onModalClose = () => { 
    setTitle(selectedProduct?.name);
    onClose();
  }

  // if (!product) return null;

  return (
    <Modal 
      isVisible={isVisible} 
      onSwipeComplete={onModalClose} 
      swipeDirection="down"
      backdropColor="black" backdropOpacity={0.5} onBackdropPress={onModalClose}
      style={styles.modal}
    >
      <View style={styles.container}>
         <Text>Item ID: {selectedProduct?.basketId}</Text>
            
      </View>
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
        padding: 20, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16,
        minHeight: 200,
    },
    textEdit: {
        // height: 100,
        padding: 10,
        fontSize: TextFontSize,
        fontFamily: MainFont,
        paddingVertical: 10,
        // lineHeight: Platform.OS === 'android' ? 24 : '140%',
        // borderColor: '#ddd',
        // borderWidth: 1,
    },

});

export default ModalItemInfo;