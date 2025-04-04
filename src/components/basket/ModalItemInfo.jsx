import React, {useState, useEffect} from "react";
import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import Modal from "react-native-modal";

const { width, height } = Dimensions.get('window');
import { useFonts } from 'expo-font';
import { MainFont, MainFont_Bold, MainFont_Title, SecondTitleFontSize, TextFontSize } from "../../../assets/Styles/styleVariables";

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
    setTitle(selectedProduct?.name);
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

        
         
         <Image style={styles.productImage}
                source={ selectedProduct?.imageUri 
                ? { uri: selectedProduct?.imageUri } 
                : require('../../../assets/ProductImages/banana_test.png')
                  }/>
        <Text style={styles.yourNotes}>{selectedProduct?.name}</Text>
        <Text style={styles.yourNotes}>Your notes</Text>
        <Text style={styles.productNotes}>{selectedProduct?.notes}</Text>
            
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
    yourNotes: {
      fontFamily: MainFont_Title,
      fontSize: SecondTitleFontSize,
      padding: 20,
    },
    productNotes: {
      fontFamily: MainFont,
      fontSize: TextFontSize,
      paddingHorizontal: 20,
      minHeight: 100,
    }

});

export default ModalItemInfo;