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
  Image
} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';

import * as Crypto from 'expo-crypto';
import { GoogleAuthProvider, OAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import useAuthStore from '../store/authStore';
import { ensureUserAccount } from '../store/userAccountStore';

import { useFonts } from 'expo-font';
import { addButtonColor, buttonColor, MainFont, MainFont_Bold } from '../../assets/Styles/styleVariables';

WebBrowser.maybeCompleteAuthSession();

const LoginPage = ({ navigation }) => {

  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    // 'Inter-Bold': require('../../assets/fonts/Grotesk/SpaceGrotesk-Light.ttf'),
  });


  const [isLogin, setIsLogin] = useState(true);
  const [emailLogin, setEmailLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('');
  const [emailSignup, setEmailSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [error, setError] = useState('');
  const setUser = useAuthStore((state) => state.setUser);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

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
        .then(async (userCredential) => {
          const user = userCredential.user;

          // 🔐 Ensure Firestore user document exists
          await ensureUserAccount({ userId: user.uid }, user.email);

          // 🧠 Set Zustand store user
          setUser(user);

          navigation.navigate('FridgePage');
        })
        .catch(() => setError('Google sign-in failed'));
    }
  }, [response]);

  const handleLogin = async () => {
    try {
      setError('');
      const userCredential = await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch {
      setError('Invalid email or password');
    }
  };

  const handleSignup = async () => {
    try {
      if (passwordSignup !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, emailSignup, passwordSignup);
      setUser(userCredential.user);
      navigation.navigate('FridgePage');
    } catch {
      setError('Error creating account');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const rawNonce = Array.from({ length: 32 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
      ).join('');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const appleCred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
        state: rawNonce, // any random string
      });

      if (!appleCred.identityToken) throw new Error('No identityToken from Apple');

      const provider = new OAuthProvider('apple.com');
      const firebaseCred = provider.credential({
        idToken: appleCred.identityToken,
        rawNonce, // IMPORTANT: raw (not hashed) nonce
      });

      const userCredential = await signInWithCredential(auth, firebaseCred);
      const user = userCredential.user;

      // ensure Firestore user doc if you need (like you do for Google)
      await ensureUserAccount({ userId: user.uid }, user.email);

      setUser(user);
      navigation.navigate('FridgePage');
    } catch (e) {
      console.log(e);
      setError('Apple sign-in failed');
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
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!showPasswordLogin}
                  value={passwordLogin}
                  onChangeText={setPasswordLogin}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPasswordLogin(prev => !prev)}
                >
                  <Ionicons name={showPasswordLogin ? 'eye-off' : 'eye'} size={22} color="#555" />
                </Pressable>
              </View>

              {error ? (
                <View style={{ height: 16 }} >
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={{ height: 16 }} />
              )}

              <TouchableOpacity style={styles.buttonContinue} onPress={handleLogin}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput style={styles.input} placeholder="Email" value={emailSignup} onChangeText={setEmailSignup} autoCapitalize="none" />
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!showPassword1}
                  value={passwordSignup}
                  onChangeText={setPasswordSignup}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword1(prev => !prev)}
                >
                  <Ionicons name={showPassword1 ? 'eye-off' : 'eye'} size={22} color="#555" />
                </Pressable>
              </View>

              <View style={{ position: 'relative' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat Password"
                  secureTextEntry={!showPassword2}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword2(prev => !prev)}
                >
                  <Ionicons name={showPassword2 ? 'eye-off' : 'eye'} size={22} color="#555" />
                </Pressable>
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <View style={{ height: 16 }} />
              )}

              <TouchableOpacity style={styles.buttonContinue} onPress={handleSignup}>
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
          
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ fontFamily: MainFont_Bold, fontSize: 16}}>or</Text>
          </View>

          {/* Social Login */}
          <View>
            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
              <View style={styles.googleButtonContent}>
                <Image
                  source={require('../../assets/googleIcon.png')}
                  style={styles.googleImage}
                />
                <Text style={{color: "black", fontFamily: MainFont, fontSize: 18,}}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={5}
                style={{ width: '100%', height: 44, marginTop: 12 }}
                onPress={handleAppleSignIn}
              />
            )}
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
    gap: 12,
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
    fontFamily: MainFont,
  },
  activeTabText: {
    color: 'blue',
    fontWeight: 'bold',
    fontFamily: MainFont,
  },
  errorText: {
    color: 'red',
    // marginTop: 6,
    fontSize: 14,
    fontFamily: MainFont,
  },
  buttonContinue: {
    backgroundColor: addButtonColor,
    borderRadius: 10,
    padding: 10,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: MainFont,
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
    borderColor: addButtonColor,
  },
  tabText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#aaa',
  },
  activeTabText: {
    color: 'black',
  },
  eyeIcon: {
    position: 'absolute',
    alignItems: 'center',
    right: 0,
    top: '30%',
    zIndex: 1,
    width: 50,
    height: 50
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 10,
    // paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'black'
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'black',
    fontSize: 18,
    width: '100%',
  },
  googleImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

});

export default LoginPage;
