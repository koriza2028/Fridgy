import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ButtonBouncing from '../Button_Bouncing';

import { useFonts } from 'expo-font';

import { addButtonColor, buttonColor, greyTextColor, greyTextColor2, MainFont, MainFont_Bold, MainFont_SemiBold } from '../../../assets/Styles/styleVariables';

import {
  removeFamilyMember
} from '../../store/familyStore';

import useFamilyStore from '../../store/familyStore';
import useAuthStore from '../../store/authStore';

// const invitedUsers = [
//   { id: 'user-2', name: 'Array.first', color: '#f59e0b', namePosition: 'start' },
//   // { id: 'user-3', name: 'Bob', color: '#10b981', namePosition: 'start' },   
//   null, 
//   null, 
//   null,
//   // null,
// ];

const MAX_SLOTS = 5;

const UserSlot = ({ user, isCurrentUser, isOwner, loadFamilyMembers}) => {
  const familyId = useAuthStore((s) => s.familyId);
  const ownerId = useAuthStore((s) => s.ownerId);

  const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  const handleRemoveMember = (memberId) => () => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFamilyMember({
                ownerId: ownerId,
                familyId: familyId,
                memberId: memberId,
              });
              Alert.alert('Success', 'Member removed');
              await loadFamilyMembers();
            } catch (err) {
              console.error('Remove member failed', err);
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.userBox, { backgroundColor: buttonColor, justifyContent: "start" }]}>
      {isCurrentUser ? (
        <Text style={styles.userText}>You, {user.email} </Text>
      ) : (
        <>
          <Text style={styles.userText}>{user.email}</Text>
          {isOwner && (
            <Pressable style={styles.editButton} onPress={handleRemoveMember(user.userId)}>
              <MaterialIcons name={'remove-circle'} size={20} color="white" />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
};

const UserSlots = ({ currentUser, createInvite }) => {
  const familyId = useAuthStore((s) => s.familyId);
  const ownerId = useFamilyStore((s) => s.ownerId);
  const fetchOwnerId = useFamilyStore((s) => s.fetchOwnerId);
  const clearOwnerId = useFamilyStore((s) => s.clearOwnerId);

  const familyMembers = useFamilyStore((s) => s.familyMembers);
  const setFamilyMembers = useFamilyStore((s) => s.setFamilyMembers);
  const fetchFamilyMembers = useFamilyStore((s) => s.fetchFamilyMembers);

  const isOwner = currentUser?.uid === ownerId;

  const loadFamilyMembers = async () => {
    if (!familyId) {
      setFamilyMembers([]);
      return;
    }
    try {
      const members = await fetchFamilyMembers(familyId, currentUser.uid);
      setFamilyMembers(members);
    } catch (err) {
      console.error('Failed to load family members', err);
      Alert.alert('Error', 'Could not load family members');
    }
  };

  useEffect(() => {
    if (!familyId) {
      clearOwnerId();
      setFamilyMembers([]);
      return;
    }
    fetchOwnerId(familyId);
    loadFamilyMembers();
  }, [familyId]);

  return (
    <View style={styles.container}>
      <UserSlot user={currentUser} isCurrentUser={true} isOwner={isOwner} />
      {familyMembers.map((user, index) => (
        <UserSlot key={index} user={user} isCurrentUser={false} isOwner={isOwner} loadFamilyMembers={loadFamilyMembers} />
      ))}
      {isOwner && familyMembers.length < MAX_SLOTS - 1 && (
        <ButtonBouncing
          scale={0.95}
          onPress={async () => {
            await createInvite();
            await loadFamilyMembers();
          }}
          style={[styles.userBox, styles.emptyBox]}
          innerStyle={styles.innerPress}
          label={<Text style={styles.plusSign}>+ Add member</Text>}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    // padding: 16,
    gap: 10,
    marginTop: 10,
  },
  userText: {
    fontSize: 16,
    color: greyTextColor2,
    fontFamily: MainFont_SemiBold,
  },
  userName_Input: {
    flex: 1,
    fontSize: 16,
    flexDirection: 'row',
    fontFamily: MainFont,
    color: 'white',
    // paddingVertical: 8,
  },
  editButton: {
    padding: 8,
    position: 'absolute',
    right: 10,
  },
  userBox: {
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  emptyBox: {
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  plusSign: {
    fontSize: 16,
    color: greyTextColor,
    fontFamily: MainFont,
  },
  innerPress: {
    width: '100%',
    height: '100%',
    alignItems: 'start',
    justifyContent: 'center',
  },
  
});

export default UserSlots;
