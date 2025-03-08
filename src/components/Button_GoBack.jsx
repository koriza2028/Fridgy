import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';

export default function ButtonGoBack() {

    const navigation = useNavigation();

    return (         
            <TouchableOpacity style={styles.Button_GoBack}
                onPress={() => navigation.goBack()}>
            <Entypo name="chevron-left" size={32} />
            </TouchableOpacity>
    )}

const styles = StyleSheet.create({

    Button_GoBack: {
        position: 'absolute',
        top: 54,
        left: 2,
    }
})