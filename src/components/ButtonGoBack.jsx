import React from "react";
import { StyleSheet, Pressable } from "react-native";
import Entypo from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';

export default function ButtonGoBack() {

    const navigation = useNavigation();

    return (         
            <Pressable style={styles.Button_GoBack}
                onPress={() => navigation.goBack()}>
            <Entypo name="chevron-left" size={32} />
            </Pressable>
    )}

const styles = StyleSheet.create({

    Button_GoBack: {
        position: 'absolute',
        top: 54,
        left: 2,
    }
})