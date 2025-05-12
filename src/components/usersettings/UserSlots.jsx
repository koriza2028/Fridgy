import React, {useState} from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';


import { addButtonColor, buttonColor } from '../../../assets/Styles/styleVariables';

const currentUser = {
  id: 'user-1',
  name: 'You',
  color: addButtonColor,
  namePosition: 'center'
};

const invitedUsers = [
  { id: 'user-2', name: 'Alice', color: '#f59e0b', namePosition: 'start' }, // orange
  { id: 'user-3', name: 'Bob', color: '#10b981', namePosition: 'start' },   // green
  null, // empty slot
  null, // empty slot
];

const MAX_SLOTS = 5;

const UserSlot = ({ user, isCurrentUser }) => {
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
      <Pressable style={[styles.userBox, styles.emptyBox]}>
        <Text style={styles.plusSign}>+ Add members</Text>
      </Pressable>
    );
  }

  return (
    // <View style={[styles.userBox, { backgroundColor: user.color }]}>
    //   <Text style={styles.userText}>{isCurrentUser ? 'You' : user.name}</Text>
    // </View>

    <View style={[styles.userBox, { backgroundColor: user.color, justifyContent: user.namePosition }]}>
      {isCurrentUser ? (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={isEditable}
            style={[
              styles.userName_Input,
              { color: isEditable ? 'white' : 'rgba(255,255,255,0.7)' },
            ]}
          />
          <Pressable onPress={() => setIsEditable(!isEditable)} style={styles.editButton}>
            <MaterialIcons name={isEditable ? 'check' : 'edit'} size={20} color="white" />
          </Pressable>
        </>
      ) : (
        <Text style={[styles.userText]}>{user.name}</Text>
      )}
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
    gap: 10,
    marginTop: 10,
  },
  userName_Input: {
    flex: 1,
    fontSize: 16,
    flexDirection: 'row',
    // paddingVertical: 8,
  },
  editButton: {
    padding: 8,
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
    fontSize: 20,
    color: '#999',
    fontWeight: 'bold',
    // alignSelf: 'start',
  },
  userText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});

export default UserSlots;
