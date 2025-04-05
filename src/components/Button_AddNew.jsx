import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { addButtonColor, MainFont_Bold } from '../../assets/Styles/styleVariables';

const AddNewButton = ({ creativeAction }) => {
    return (
        <Pressable style={styles.Button_AddProduct} onPress={() => creativeAction()}>
            <Text style={styles.Button_AddProduct_Text}>+</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    Button_AddProduct: {
          position: 'absolute',
          bottom: 20,
          right: 10,
        //   flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 50,
          height: 50,
        //   paddingVertical: 15,
        //   paddingHorizontal: 15,
          marginHorizontal: 10,
          backgroundColor: '#FFF',
          borderRadius: 60,
          borderColor: addButtonColor,
          borderWidth: 2,
          
          shadowColor: '#007bff', 
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 2,
          elevation: 2,        
        },
    
        Button_AddProduct_Text: {
            fontFamily: MainFont_Bold,
            fontSize: 28,
            textAlign: 'center',
            marginBottom: 2,
        }
});

export default AddNewButton;