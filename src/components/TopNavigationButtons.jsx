import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import UserOptionsModal from './UserOptionsModal';
import NotificationsModal from './NotificationsModal';

import useAuthStore from '../store/authStore';
import useNotificationsStore from '../store/notificationsStore';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';

const TopNavigationButtons = () => {
  const navigation = useNavigation();

  const [showUserOptions, setShowUserOptions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });

  const { fetchNotifications, totalMissingCount } = useNotificationsStore();

  // Fetch notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (ctx) {
        fetchNotifications(ctx);
      }
    }, [ctx.userId, ctx.familyId])
  );

  return (
    <View style={styles.container}>
      {/* Notifications Button with Badge */}
      <Pressable onPress={() => setShowNotifications(true)} style={styles.iconWrapper}>
        <MaterialIcons name="notifications" size={28} color="black" />
        {totalMissingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalMissingCount}</Text>
          </View>
        )}
      </Pressable>

      {/* User Options Button */}
      <Pressable onPress={() => setShowUserOptions(true)}>
        <MaterialIcons name="account-circle" size={28} color="black" />
      </Pressable>

      {/* Modals */}
      <UserOptionsModal
        isVisible={showUserOptions}
        onClose={() => setShowUserOptions(false)}
        onViewProfile={() => {
          setShowUserOptions(false);
          navigation.navigate('UserSettingsPage');
        }}
        navigation={navigation}
      />
      <NotificationsModal
        isVisible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    marginRight: 20,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default TopNavigationButtons;
