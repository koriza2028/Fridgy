// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Dimensions } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');
import { backgroundColor } from '../../assets/Styles/styleVariables';

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setError(null);
  }, []);

  const handleLogin = async () => {
    try {
      // Sign out any existing user before logging in
      await auth.signOut();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleSignup = async () => {
    try {
      // Sign out any existing user before signing up
      await auth.signOut();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch (err) {
      setError('Error creating account');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>

    <View style={styles.LoginPage}>

      <View style={styles.container}>

        {/* <Text style={styles.title}>Login / Sign Up</Text> */}
        <View style={styles.theButtons}>
          <TouchableOpacity onPress={handleLogin} style={styles.button}> 
            <Text style={styles.textInButtons}>Login</Text>
          </TouchableOpacity>

          <Text style={styles.textBetweenButtons}> / </Text>

          <TouchableOpacity  onPress={handleSignup} style={styles.button}> 
            <Text style={styles.textInButtons}>Sign Up</Text>  
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={{ height: 16 }} />
        )}

        <TouchableOpacity style={styles.buttonContinue}>
          <Text style={[styles.textInButtons, {fontSize: 20, color: 'white'}]}>Continue</Text>
        </TouchableOpacity>

      </View>

    </View>  
    
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  LoginPage: {
    flex: 1,
    // backgroundColor: backgroundColor,
    alignItems: 'center',
    width: width,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    width: width * 0.96,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderRadius: 8,
    borderColor: '#ccc',
    backgroundColor: backgroundColor,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
  },

  theButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // borderWidth: 1,
    // borderColor: '#007BFF',
    width: 160,
    marginBottom: 20,
    alignSelf: 'center'
  },
  button: {
    // borderWidth: 1,
    // borderColor: '#007BFF',
    borderRadius: 6,
    // padding: 6,
    marginTop: 10,
  },
  textBetweenButtons: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  textInButtons: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContinue: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 6,
    backgroundColor: 'black'
  },



  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default LoginPage;
