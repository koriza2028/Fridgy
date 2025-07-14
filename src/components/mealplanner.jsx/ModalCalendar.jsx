// components/CalendarModal.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';

import ButtonBouncing from '../Button_Bouncing';

import { useFonts } from 'expo-font';
import { buttonColor, MainFont, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';
import Entypo from 'react-native-vector-icons/Entypo';

const { width, height } = Dimensions.get('window');

export default function CalendarModal({ isVisible, onClose, onDaySelect, selectedDate }) {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

    const [shouldRender, setShouldRender] = useState(isVisible);
    useEffect(() => {
      if (isVisible) {
        setShouldRender(true);
      } else {
        const timeout = setTimeout(() => setShouldRender(false), 300); // match fadeOut
        return () => clearTimeout(timeout);
      }
    }, [isVisible]);

    if (!shouldRender) return null;
    
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.5}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={400}
      animationOutTiming={300}
      style={styles.modal}
    >
      {isVisible && (
      <View style={styles.modalContent}>
        <Text style={styles.header}>Select a date</Text>
        <Calendar
          onDayPress={(day) => {
            onDaySelect(day.dateString);
            onClose();
          }}
          markedDates={{
            [selectedDate]: {
              selected: true,
              selectedColor: '#00adf5',
            }
          }}
          theme={{
            arrowColor: buttonColor,
            textDayFontFamily: MainFont,
            textMonthFontFamily: MainFont,

            'stylesheet.calendar.header': {
              header: {
                flexDirection: 'row',
                justifyContent: 'space-between', // push arrows to the edges
                alignItems: 'center',
                paddingHorizontal: 50, // add side padding
                marginBottom: 10,
              },
            },
            
          }}
          style={styles.calendar}
          renderArrow={(direction) => (
            <Entypo
              name={direction === 'left' ? 'arrow-long-left' : 'arrow-long-right'}
              size={24}
              color="#333"
            />
          )}
        />

        <ButtonBouncing
          onPress={onClose}
          style={[{ position: 'absolute', bottom: 20,}, styles.closeButton]}
          label={<Text style={styles.closeButtonText}>Close</Text>}
          />
        {/* <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable> */}
      </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    height: 480,
  },
  calendar: {
    // borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
    width: width*0.9,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: buttonColor,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 50,
        borderRadius: 60,
        // shadowColor: buttonColor, 
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.4,
        // shadowRadius: 2,
        // elevation: 2,  
  },
  closeButtonText: {
    color: '#333',
    textAlign: 'center',
    fontFamily: MainFont,
    fontSize: SecondTitleFontSize,
  },
});
