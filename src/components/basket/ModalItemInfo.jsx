import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Modal from "react-native-modal";

const ModalItemInfo = ({ isVisible, onClose, itemId }) => {
  return (
    <Modal 
      isVisible={isVisible} 
      onSwipeComplete={onClose} 
      swipeDirection="down"
      backdropColor="black" backdropOpacity={0.5} onBackdropPress={onClose}
      style={styles.modal}
    >
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Item Info</Text>
            <Text>Item ID: {itemId}</Text>

            {/* {itemId ? <Text>Item ID: {itemId}</Text> : <Text>No ID provided</Text>} */}
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
    mainTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },

});

export default ModalItemInfo;