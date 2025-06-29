import React, {useState, useEffect} from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useFonts } from 'expo-font';

import { addButtonColor, buttonColor, greyTextColor, MainFont, MainFont_Bold } from '../../../assets/Styles/styleVariables';


import { setUsername } from '../../store/userAccountStore';
import {
  exitFamilyMembership,
  removeFamilyMember,
  clearOwnerId
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

const UserSlot = ({ user, isCurrentUser, createInvite }) => {
  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);
  const familyId = useAuthStore((s) => s.familyId);

  const [fontsLoaded] = useFonts({
        'Inter': require('../../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
        'Inter-Bold': require('../../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    });


    const [text, setText] = useState("John Doe"); // default value
    const [isEditable, setIsEditable] = useState(false);
  
    const handleIconPress = () => {
      if (isEditable) {
        // Save logic here (e.g., update to Firestore)
        console.log('Saved:', text);
      }
      setIsEditable(!isEditable);
    };

  if (!user) {
    return (
      <Pressable style={[styles.userBox, styles.emptyBox]} onPress={createInvite}>
        <Text style={styles.plusSign}>+ Add member</Text>
      </Pressable>
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

    <View style={[styles.userBox, { backgroundColor: '#10b981', justifyContent: "start" }]}>
      {isCurrentUser ? (
        <>
          <Text style={styles.staticPrefix}>You, </Text>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={isEditable}
            style={[
              styles.userName_Input,
            ]}
          />
          {/* <Pressable onPress={() => setIsEditable(!isEditable)} style={styles.editButton}>
            <MaterialIcons name={isEditable ? 'check' : 'edit'} size={20} color="white" />
          </Pressable> */}
        </>
      ) : (
        <>
        <Text style={[styles.userText]}>{user.username}</Text>
        <Pressable style={styles.editButton} onPress={handleRemoveMember(user.userId)}>
          <MaterialIcons name={'remove-circle'} size={20} color="white" />
        </Pressable>
        </>
        
      )}
    </View>
  );
};

const UserSlots = ({currentUser, members, createInvite}) => {
  return (
    <View style={styles.container}>
        <UserSlot user={currentUser} isCurrentUser={true} />
        {members.map((user, index) => (
          <UserSlot key={index} user={user} isCurrentUser={false}/>
        ))}
        <UserSlot user={null} isCurrentUser={false} createInvite={createInvite}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    gap: 10,
    marginTop: 10,
  },
  staticPrefix: {
    fontFamily: MainFont,
    color: 'white',
    fontSize: 16,
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
  userText: {
    fontSize: 16,
    color: 'white',
    fontFamily: MainFont,
  },
});

export default UserSlots;
