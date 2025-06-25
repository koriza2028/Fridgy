import React, {useState} from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { addButtonColor, buttonColor, greyTextColor, MainFont, MainFont_Bold } from '../../../assets/Styles/styleVariables';

// const currentUser = {

// const invitedUsers = [
//   { id: 'user-2', name: 'Array.first', color: '#f59e0b', namePosition: 'start' },
//   // { id: 'user-3', name: 'Bob', color: '#10b981', namePosition: 'start' },   
//   null, 
//   null, 
//   null,
//   // null,
// ];

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
        <Text style={styles.plusSign}>+ Add member</Text>
      </Pressable>
    );
  }

  return (
    // <View style={[styles.userBox, { backgroundColor: user.color }]}>
    //   <Text style={styles.userText}>{isCurrentUser ? 'You' : user.name}</Text>
    // </View>

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
          <Pressable onPress={() => setIsEditable(!isEditable)} style={styles.editButton}>
            <MaterialIcons name={isEditable ? 'check' : 'edit'} size={20} color="white" />
          </Pressable>
        </>
      ) : (
        <Text style={[styles.userText]}>{user.username}</Text>
      )}
    </View>
  );
};

const UserSlots = ({currentUser, members}) => {
  return (
    <View style={styles.container}>
        <UserSlot user={currentUser} isCurrentUser={true} />
        {members.map((user, index) => (
          <UserSlot key={index} user={user} isCurrentUser={false} />
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
