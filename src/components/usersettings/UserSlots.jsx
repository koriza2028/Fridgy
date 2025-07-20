import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ButtonBouncing from '../Button_Bouncing';

import { useFonts } from 'expo-font';

import { addButtonColor, buttonColor, greyTextColor, greyTextColor2, MainFont, MainFont_Bold, MainFont_SemiBold } from '../../../assets/Styles/styleVariables';


import { setUsername } from '../../store/userAccountStore';
import {
  exitFamilyMembership,
  removeFamilyMember,
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

const UserSlot = ({ user, isCurrentUser, createInvite, loadFamilyMembers}) => {
    const familyId = useAuthStore((s) => s.familyId);

  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);

  const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });

  if (!user) {
    return (
      <ButtonBouncing scale={0.95} onPress={createInvite} style={[styles.userBox, styles.emptyBox]} innerStyle={styles.innerPress}
        label={<Text style={styles.plusSign}>+ Add member</Text>}
      />
      // <Pressable style={[styles.userBox, styles.emptyBox]} onPress={createInvite}>
        
      // </Pressable>
    );
  }

  useEffect(() => {
    if (!familyId) {
      clearOwnerId();
      return;
    }
    fetchOwnerId(familyId);
  }, [familyId]);

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
        <>
          <Text style={styles.userText}>You, {user.email} </Text>
          {/* <Pressable onPress={() => setIsEditable(!isEditable)} style={styles.editButton}>
            <MaterialIcons name={isEditable ? 'check' : 'edit'} size={20} color="white" />
          </Pressable> */}
        </>
      ) : (
        <>
        <Text style={[styles.userText]}>{user.email}</Text>
        <Pressable style={styles.editButton} onPress={handleRemoveMember(user.userId)}>
          <MaterialIcons name={'remove-circle'} size={20} color="white" />
        </Pressable>
        </>
        
      )}
    </View>
  );
};

const UserSlots = ({currentUser, createInvite}) => {
  const familyId = useAuthStore((s) => s.familyId);

  const familyMembers = useFamilyStore((state) => state.familyMembers);
  const setFamilyMembers = useFamilyStore((state) => state.setFamilyMembers);
  const fetchFamilyMembers = useFamilyStore((state) => state.fetchFamilyMembers);

  const loadFamilyMembers = async () => {
      if (!familyId) {
        setFamilyMembers([]);
        return;
      }
      try {
        const members = await fetchFamilyMembers(familyId);
        setFamilyMembers(members);
      } catch (err) {
        console.error('Failed to load family members', err);
        Alert.alert('Error', 'Could not load family members');
      }
    };

  useEffect(() => {
    if (!familyId) {
      setFamilyMembers([]);
      return;
    }
    loadFamilyMembers();
  }, [familyId]);

  return (
    <View style={styles.container}>
        <UserSlot user={currentUser} isCurrentUser={true} />
        {familyMembers.map((user, index) => (
          <UserSlot key={index} user={user} isCurrentUser={false} loadFamilyMembers={loadFamilyMembers}/>
        ))}
        {familyMembers.length < MAX_SLOTS - 1 && (
          <UserSlot
            user={null}
            isCurrentUser={false}
            createInvite={async () => {
              await createInvite();
              await loadFamilyMembers();
            }}
            loadFamilyMembers={loadFamilyMembers}
          />
        )}
        {/* <UserSlot user={null} isCurrentUser={false} createInvite={createInvite}/> */}
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
    justifyContent: 'start',
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
