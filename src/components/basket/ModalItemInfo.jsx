import React, {useState, useEffect} from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import Modal from "react-native-modal";

import { useFonts } from 'expo-font';
import { MainFont, SecondTitleFontSize, TextFontSize } from "../../../assets/Styles/styleVariables";

const ModalItemInfo = ({ isVisible, onClose, itemId, isFridge }) => {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const [title, setTitle] = useState(itemId);

  useEffect(() => {
    setTitle(itemId);
  }, [itemId]);

  onModalClose = () => { 
    setTitle(itemId);
    onClose();
  }

  return (
    <Modal 
      isVisible={isVisible} 
      onSwipeComplete={onModalClose} 
      swipeDirection="down"
      backdropColor="black" backdropOpacity={0.5} onBackdropPress={onModalClose}
      style={styles.modal}
    >
      <View style={styles.container}>
        {isFridge ? <Text>Item ID: {itemId}</Text> 
        
        
        : <TextInput style={styles.textEdit} value={title} onChangeText={text => setTitle(text)}></TextInput>}
            
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
    },
    textEdit: {
        minHeight: 40,
        padding: 10,
        fontSize: TextFontSize,
        fontFamily: MainFont,
    },

});

export default ModalItemInfo;