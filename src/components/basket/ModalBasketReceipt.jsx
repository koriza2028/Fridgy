import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from "react";

import { MainFont, MainFont_Bold, SecondTitleFontSize, backgroundColor } from '../../../assets/Styles/styleVariables';

import Modal from 'react-native-modal';

// import { Dimensions } from 'react-native';
// const { width, height } = Dimensions.get('window');


export default function ModalBasketReceipt({ visible, onClose, onMove, receiptItems }) {

    const [amount, setAmount] = useState('');

    const moveSelectedProducts = async () => {
        onMove();
        onClose();
    }; 

    return (

        <Modal visible={visible}
                animationIn="fadeIn"
                animationOut="fadeOut"
                animationInTiming={1}
                animationOutTiming={1} 
                style={styles.ModalBasketReceipt}>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            <View style={styles.ModalReceipt_Wrapper}>

                <View style={styles.ModalReceiptHeader}>
                    <Text style={styles.ModalReceiptHeader_Text}>This is your receipt</Text>
                </View>

                <View style={styles.ListOfReceiptItems}>

                    {receiptItems.map((receiptItem, index) => (
                        <View key={index} style={styles.ReceiptItem}>
                            <Text style={styles.ReceiptItem_Text}>{receiptItem.name}</Text>
                            <TextInput selectTextOnFocus={true} keyboardType="numeric" value={receiptItem.amount} onChangeText={text => setAmount(text)} 
                                style={[styles.ReceiptItemAmount, styles.ReceiptItem_Text]}/>
                            {/* <Text >{checkIsFromFridge(receiptItem.isFromFridge)}</Text> */}
                        </View>
                        ))
                    }

                </View>

                <TouchableOpacity style={styles.Button_MoveItems} onPress={moveSelectedProducts}>
                    <Text style={styles.Button_MoveItems_Text}>Move items</Text>
                </TouchableOpacity>

            </View>
        </Modal>

)}



    const styles = StyleSheet.create({
        
        ModalBasketReceipt: {
            backgroundColor: backgroundColor,
            margin: 0,
            // alignItems: 'flex-start'
            justifyContent: 'flex-start'
        },

        ModalReceipt_Wrapper: {
            marginTop: 100,
            // borderColor: '#C0C0C0',
            // borderTopWidth: 1,
        },

        ModalReceiptHeader: {
            
        },

        ModalReceiptHeader_Text: {
            fontSize: 28,
        },

        ListOfReceiptItems: {
            marginTop: 20,
            marginBottom: 20,
        },

        ReceiptItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            // width: '100%',
            borderColor: '#C0C0C0',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            padding: 8,
        },

        ReceiptItem_Text: {
            fontSize: 16,
        },

        ReceiptItemAmount: {
            width: 60,
        },


        Button_MoveItems: {
            marginVertical: 5,
            // marginHorizontal: 2,
            paddingLeft: 14,
            justifyContent: 'center',
            backgroundColor: '#eee',
            // borderRadius: 30,
            borderColor: '#C0C0C0',
            // borderWidth: 1,
            height: 50,
    
            backgroundColor: 'lightblue',
            justifyContent: 'center',
            alignItems: 'center',
            width: '80%',
            position: 'absolute',
            top: '90%',
            // borderRadius: 30,
        },
        Button_MoveItems_Text: {
            fontWeight: 'bold',
        },


        closeButton: {
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
          },
          closeButtonText: {
            fontSize: 20,
            color: 'black',
            fontWeight: 'bold',
          },
    
    });