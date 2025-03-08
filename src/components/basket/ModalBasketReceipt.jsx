import { View, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import React, { useState } from "react";

import { MainFont, MainFont_Bold, SecondTitleFontSize, backgroundColor } from '../../../assets/Styles/styleVariables';

import Modal from 'react-native-modal';

export default function ModalBasketReceipt({ visible, onClose, onMove, receiptItems }) {

    const [amount, setAmount] = useState('');

    const moveSelectedProducts = async () => {
        onMove();
        onClose();
    }; 

    // Separate receipt items into fridge items and others.
    const fridgeItems = receiptItems.filter(item => item.isFromFridge);
    const nonFridgeItems = receiptItems.filter(item => !item.isFromFridge);

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
                    {fridgeItems.length > 0 && (
                        <>
                            <Text style={styles.SectionTitle}>Fridge Items</Text>
                            {fridgeItems.map((receiptItem, index) => (
                                <View key={`fridge-${index}`} style={styles.ReceiptItem}>
                                    <Text style={styles.ReceiptItem_Text}>{receiptItem.name}</Text>
                                    <TextInput 
                                        selectTextOnFocus={true} 
                                        keyboardType="numeric" 
                                        value={String(receiptItem.amount)} 
                                        onChangeText={text => setAmount(text)} 
                                        style={[styles.ReceiptItemAmount, styles.ReceiptItem_Text]}
                                    />
                                </View>
                            ))}
                        </>
                    )}

                    {fridgeItems.length > 0 && nonFridgeItems.length > 0 && (
                        <View style={styles.Separator} />
                    )}

                    {nonFridgeItems.length > 0 && (
                        <>
                            <Text style={styles.SectionTitle}>Other Items</Text>
                            {nonFridgeItems.map((receiptItem, index) => (
                                <View key={`nonfridge-${index}`} style={styles.ReceiptItem}>
                                    <Text style={styles.ReceiptItem_Text}>{receiptItem.name}</Text>
                                    <TextInput 
                                        selectTextOnFocus={true} 
                                        keyboardType="numeric" 
                                        value={String(receiptItem.amount)} 
                                        onChangeText={text => setAmount(text)} 
                                        style={[styles.ReceiptItemAmount, styles.ReceiptItem_Text]}
                                    />
                                </View>
                            ))}
                        </>
                    )}
                </View>

                <TouchableOpacity style={styles.Button_MoveItems} onPress={moveSelectedProducts}>
                    <Text style={styles.Button_MoveItems_Text}>Move items</Text>
                </TouchableOpacity>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    ModalBasketReceipt: {
        backgroundColor: backgroundColor,
        margin: 0,
        justifyContent: 'flex-start'
    },
    ModalReceipt_Wrapper: {
        marginTop: 100,
    },
    ModalReceiptHeader: {},
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
    SectionTitle: {
        fontSize: 20,
        fontFamily: MainFont_Bold,
        marginVertical: 8,
    },
    Separator: {
        borderBottomColor: '#C0C0C0',
        borderBottomWidth: 1,
        marginVertical: 8,
    },
    Button_MoveItems: {
        marginVertical: 5,
        paddingLeft: 14,
        justifyContent: 'center',
        backgroundColor: 'lightblue',
        alignItems: 'center',
        width: '80%',
        position: 'absolute',
        top: '90%',
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
