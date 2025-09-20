// components/CalendarModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar } from 'react-native-calendars';

import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ButtonBouncing from '../Button_Bouncing';
import { usePremiumStore } from '../../store/premiumStore';

import { useFonts } from 'expo-font';
import { buttonColor, MainFont, SecondTitleFontSize } from '../../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

function ymdLocalString(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarModal({ isVisible, onClose, onDaySelect, selectedDate }) {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });

  const isPremium = usePremiumStore(s => s.isPremium);

  const isLockedDate = (ds) => !isPremium && ds > maxFreeStr; // past OK; only future beyond window is locked


  const todayStr = useMemo(() => ymdLocalString(new Date()), []);
  const maxFreeStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6); // today + 6 days
    return ymdLocalString(d);
  }, []);

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

  const handleDayPress = (day) => {
    const dateStr = day?.dateString;
    if (!dateStr) return;

    if (!isPremium && dateStr > maxFreeStr) {
      // Normally maxDate disables taps; guard here just in case.
      Alert.alert('Plus feature', 'Planning more than 7 days ahead requires Plus.');
      return;
    }

    onDaySelect(dateStr);
    onClose();
  };

  const marked = {
    ...(selectedDate ? {
      [selectedDate]: { selected: true, selectedColor: '#00adf5' }
    } : {})
  };

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

          {!isPremium && (
            <Text style={styles.freeHint}>
              You can plan up to {maxFreeStr} (next 7 days). Upgrade to unlock all future dates.
            </Text>
          )}

          <Calendar
            // we render our own day cells, so we handle presses here
            dayComponent={({ date, state }) => {
              const ds = date?.dateString;
              const locked = isLockedDate(ds);
              const selected = selectedDate === ds;

              return (
                <Pressable
                  onPress={() => {
                    if (!locked) {
                      onDaySelect(ds);
                      onClose();
                    }
                  }}
                  disabled={locked}
                  style={[styles.dayCell, selected && styles.daySelected]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      state === 'disabled' && { color: '#bbb' },
                      locked && { color: '#bbb' },
                    ]}
                  >
                    {date.day}
                  </Text>

                  {locked && (
                    <MaterialIcons name="star" size={12} color="#999" style={styles.lockIcon} />
                  )}
                </Pressable>
              );
            }}
            theme={{
              arrowColor: buttonColor,
              textDayFontFamily: MainFont,
              textMonthFontFamily: MainFont,
              'stylesheet.calendar.header': {
                header: {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: 50,
                  marginBottom: 10,
                },
              },
            }}
            // keep other props you had:
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
            style={[{ position: 'absolute', bottom: 20 }, styles.closeButton]}
            label={<Text style={styles.closeButtonText}>Close</Text>}
          />
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
    height: 520,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  freeHint: {
    marginTop: 6,
    marginBottom: 6,
    fontFamily: MainFont,
    fontSize: 12,
    color: '#666',
  },
  calendar: {
    borderColor: '#ccc',
    borderRadius: 8,
    marginVertical: 10,
    width: width * 0.9,
  },
  closeButton: {
    backgroundColor: buttonColor,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 50,
    borderRadius: 60,
  },
  closeButtonText: {
    color: '#333',
    textAlign: 'center',
    fontFamily: MainFont,
    fontSize: SecondTitleFontSize,
  },


  dayCell: {
  width: 32,
  height: 32,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  position: 'relative',
},
daySelected: {
  backgroundColor: '#00adf5',
},
dayLabel: {
  fontFamily: MainFont,
  fontSize: 14,
  color: '#2d4150',
},
lockIcon: {
  position: 'absolute',
  right: -2,
  bottom: -2,
},

});
