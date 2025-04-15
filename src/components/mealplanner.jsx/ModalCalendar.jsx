// components/CalendarModal.jsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';

export default function CalendarModal({ isVisible, onClose, onDaySelect, selectedDate }) {
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropOpacity={0.5}
      style={styles.modal}
    >
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
          style={styles.calendar}
        />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  calendar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#333',
  },
});
