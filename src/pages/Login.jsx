import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';

WebBrowser.maybeCompleteAuthSession();

const LoginPage = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [error, setError] = useState('');
  const setUser = useAuthStore((state) => state.setUser);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '338150974075-5lvt63tugdg63dmh6hujm9uup49fis4v.apps.googleusercontent.com',
    iosClientId: '338150974075-fu1sgu03htefoep78frj3nnomgt5o3o4.apps.googleusercontent.com',
    webClientId: '338150974075-5lvt63tugdg63dmh6hujm9uup49fis4v.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          setUser(userCredential.user);
          navigation.navigate('FridgePage');
        })
        .catch(() => setError('Google sign-in failed'));
    }
  }, [response]);

  // const handleAppleSignIn = async () => {
  //   try {
  //     const appleCredential = await AppleAuthentication.signInAsync({
  //       requestedScopes: [
  //         AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
  //         AppleAuthentication.AppleAuthenticationScope.EMAIL,
  //       ],
  //     });

  //     const provider = new firebase.auth.OAuthProvider('apple.com');
  //     const credential = provider.credential({
  //       idToken: appleCredential.identityToken,
  //     });

  //     const userCredential = await signInWithCredential(auth, credential);
  //     setUser(userCredential.user);
  //     navigation.navigate('FridgePage');
  //   } catch (err) {
  //     setError('Apple sign-in failed');
  //   }
  // };

  const handleLogin = async () => {
    try {
      setError('');
      await auth.signOut();
      const userCredential = await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch {
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
    } catch {
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

          {/* Form */}
          {isLogin ? (
            <>
              <TextInput style={styles.input} placeholder="Email" value={emailLogin} onChangeText={setEmailLogin} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry value={passwordLogin} onChangeText={setPasswordLogin} />
              {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 16 }} />}
              <Pressable style={styles.buttonContinue} onPress={handleLogin}>
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput style={styles.input} placeholder="Email" value={emailSignup} onChangeText={setEmailSignup} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Password" secureTextEntry value={passwordSignup} onChangeText={setPasswordSignup} />
              {error ? <Text style={styles.errorText}>{error}</Text> : <View style={{ height: 16 }} />}
              <TouchableOpacity style={styles.buttonContinue} onPress={handleSignup}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Social Login */}
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={{ width: '100%', height: 44, marginTop: 12 }}
                onPress={handleAppleSignIn}
              />
            )} */}
          </View>

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  LoginPage: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  tab: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: 'blue',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 6,
  },
  buttonContinue: {
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default LoginPage;
