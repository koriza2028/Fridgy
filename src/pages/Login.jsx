// src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, Dimensions, Pressable } from 'react-native';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');
import { backgroundColor } from '../../assets/Styles/styleVariables';

const LoginPage = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [error, setError] = useState('');

  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async () => {
    try {
      setError('');
      await auth.signOut();
      const userCredential = await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleSignup = async () => {
    try {
      setError('');
      await auth.signOut();
      const userCredential = await createUserWithEmailAndPassword(auth, emailSignup, passwordSignup);
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

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(true);
                setError('');
              }}
              style={[styles.tab, isLogin && styles.activeTab]}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(false);
                setError('');
              }}
              style={[styles.tab, !isLogin && styles.activeTab]}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={emailLogin}
                onChangeText={setEmailLogin}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={passwordLogin}
                onChangeText={setPasswordLogin}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 16 }} />}
              <Pressable style={styles.buttonContinue} onPress={handleLogin}>
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          )}

          {/* Signup Form */}
          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={emailSignup}
                onChangeText={setEmailSignup}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={passwordSignup}
                onChangeText={setPasswordSignup}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 16 }} />}
              <Pressable style={styles.buttonContinue} onPress={handleSignup}>
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          )}
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
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'black',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    marginHorizontal: 10,
  },
  activeTab: {
    borderColor: 'black',
  },
  tabText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#aaa',
  },
  activeTabText: {
    color: 'black',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
});

export default LoginPage;
