import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { addButtonColor, buttonColor } from '../../../assets/Styles/styleVariables';

const currentUser = {
  id: 'user-1',
  name: 'You',
  color: addButtonColor, // blue
};

const invitedUsers = [
  { id: 'user-2', name: 'Alice', color: '#f59e0b' }, // orange
  { id: 'user-3', name: 'Bob', color: '#10b981' },   // green
  null, // empty slot
  null, // empty slot
];

const MAX_SLOTS = 5;

const UserSlot = ({ user, isCurrentUser }) => {
  if (!user) {
    return (
      <Pressable style={[styles.userBox, styles.emptyBox]}>
        <Text style={styles.plusSign}>+</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.userBox, { backgroundColor: user.color }]}>
      <Text style={styles.userText}>{isCurrentUser ? 'You' : user.name}</Text>
    </View>
  );
};

const UserSlots = () => {
  const allSlots = [currentUser, ...invitedUsers];
  return (
    <View style={styles.container}>
      {allSlots.map((user, index) => (
        <UserSlot key={index} user={user} isCurrentUser={index === 0} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    gap: 12,
    marginTop: 10,
  },
  userBox: {
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyBox: {
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  plusSign: {
    fontSize: 32,
    color: '#999',
    fontWeight: 'bold',
  },
  userText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});

export default UserSlots;
