import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Button,
  Pressable,
  Share,
  Alert,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Linking from 'expo-linking';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import UserSlots from '../components/usersettings/UserSlots';
import useAuthStore from '../store/authStore';
import { toggleUserMode, setUsername } from '../store/userAccountStore';

import {
  createInvite,
  listInvites,
  revokeInvite,
} from '../store/inviteStore';

import useFamilyStore from '../store/familyStore';
import { deleteFamilyIfOwner, exitFamilyMembership } from '../store/familyStore'
import { useFonts } from 'expo-font';

import {
  addButtonColor,
  backgroundColor,
  blackTextColor,
  buttonColor,
  greyTextColor,
  greyTextColor2,
  MainFont,
  MainFont_Bold,
  MainFont_SemiBold,
  SecondTitleFontSize,
  SecondTitleFontWeight,
  TextFontSize,
} from '../../assets/Styles/styleVariables';

const { width, height } = Dimensions.get('window');

export default function FamilyModePage() {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

  // ── auth context ──────────────────────────────────────────────────────
  const { userId, familyId, user, lastUsedMode } = useAuthStore((s) => ({
    userId: s.user?.uid,
    familyId: s.familyId,
    user: s.user,
    lastUsedMode: s.lastUsedMode,
  }));

  const setFamilyId = useAuthStore((s) => s.setFamilyId);
  const setLastUsedMode = useAuthStore((s) => s.setLastUsedMode);
  // ───────────────────────────────────────────────────────────────────────

  // ── family store ───────────────────────────────────────────────────────
  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);

  // ───────────────────────────────────────────────────────────────────────

  // ── username editing local state ──────────────────────────────────────
  // Store username inputs locally by userId to allow editing
  const [usernameEdits, setUsernameEdits] = useState({});
  // To track which usernames are being edited (show TextInput or Text)
  const [editingUserIds, setEditingUserIds] = useState(new Set());
  // ───────────────────────────────────────────────────────────────────────

  // ── invite state ──────────────────────────────────────────────────────
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  // ───────────────────────────────────────────────────────────────────────

  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [deleting, setDeleting] = useState(false);

  const onPressDelete = () => {
    Alert.alert(
      "Delete account?",
      "This cannot be undone. If you own a family, deletion will be blocked.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (e) {
              Alert.alert(
                "Could not delete account",
                e && e.message ? e.message : "Unknown error"
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };


  // ── load invites ──────────────────────────────────────────────────────
  const loadInvites = async () => {
    if (!familyId) return;
    setLoadingInvites(true);
    try {
      const items = await listInvites({ familyId });
      setInvites(items);
    } catch (err) {
      console.error('Failed to load invites', err);
      Alert.alert('Error', 'Could not load invites');
    } finally {
      setLoadingInvites(false);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── fetch ownerId and members on familyId change ───────────────────────
  useEffect(() => {
    if (!familyId) {
      clearOwnerId();
      return;
    }
    const load = async () => {
      await fetchOwnerId(familyId);
    };
    load();
  }, [familyId]);

  // ───────────────────────────────────────────────────────────────────────

  // ── create & share invite ─────────────────────────────────────────────
  const handleCreateInvite = async () => {
    if (!familyId) {
      Alert.alert('Error', 'You must be in family mode to invite.');
      return;
    }
    try {
      const code = await createInvite({ familyId, ownerId });
      const link = Linking.createURL('invite', { queryParams: { code } });
      await Share.share({
        title: 'Join my family',
        message: `${link}`,
      });
      loadInvites();
    } catch (err) {
      console.error('Create invite failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  const handleToggle = useCallback(async (targetMode) => {
    if (!user?.uid) {
      Alert.alert('Not logged in');
      return;
    }

    if (targetMode === lastUsedMode) return;

    if (targetMode === 'family') {
      if (familyId) {
        // User already in a family, switch directly
        try {
          const res = await toggleUserMode({
            userId: user.uid,
            lastUsedMode,
          });
          setFamilyId(res.familyId);
          setLastUsedMode(res.mode);
        } catch (e) {
          console.error('Toggle failed:', e);
          Alert.alert('Error', e.message);
        }
      } else {
        // Ask to create family if not in one
        Alert.alert(
          'Create Family?',
          'You are not in a family yet. Do you want to create one?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => {},
            },
            {
              text: 'Yes',
              onPress: async () => {
                try {
                  const res = await toggleUserMode({
                    userId: user.uid,
                    lastUsedMode,
                  });
                  setFamilyId(res.familyId);
                  setLastUsedMode(res.mode);    
                } catch (e) {
                  console.error('Toggle failed:', e);
                  Alert.alert('Error', e.message);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    } else {
      // Switching to solo mode
      try {
        const res = await toggleUserMode({
          userId: user.uid,
          lastUsedMode,
        });
        setFamilyId(res.familyId);
        setLastUsedMode(res.mode);
      } catch (e) {
        console.error('Toggle failed:', e);
        Alert.alert('Error', e.message);
      }
    }
  });

  const handleDeleteFamily = async () => {
    Alert.alert(
      "Delete Family",
      "Are you sure you want to delete the entire family?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteFamilyIfOwner({ familyId, requesterId: user.uid });
              clearOwnerId();
              setFamilyId(null); // ⬅️ Clear local familyId
              setLastUsedMode('personal'); // ⬅️ Switch to personal mode
              Alert.alert("Deleted", "Family has been deleted.");
            } catch (err) {
              console.error("Failed to delete family", err);
              Alert.alert("Error", "Failed to delete family");
            }
          },
        },
      ]
    );
  };

  const handleQuitFamily = () => {
    Alert.alert(
      'Quit Family',
      'Are you sure you want to quit the family?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: async () => {
            try {
              await exitFamilyMembership({ userId: user.uid, familyId });
              Alert.alert('Success', 'You have left the family.');
              setFamilyId(null); // ⬅️ Clear local familyId
              setLastUsedMode('personal'); // ⬅️ Switch to personal mode
            } catch (err) {
              console.error('Failed to quit family', err);
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const changeMode =
    lastUsedMode === 'family'
      ? 'Switch to Personal Mode'
      : 'Switch to Family Mode';
  const isOwner = user?.uid === ownerId;
  return (
  <View style={styles.UserSettingsPage}>
    {/* Mode toggle buttons */}
    <View style={styles.modeToggleContainer}>
      {/* Personal Mode Button */}
      <Pressable
        onPress={() => handleToggle('personal')}
        style={[
          styles.modeToggleButton,
          lastUsedMode === 'personal' && styles.modeToggleButtonSelected,
        ]}
      >
        <MaterialIcons
          name="person-outline"
          size={20}
          style={[
            styles.icon,
            lastUsedMode === 'personal' && { color: 'white' },
          ]}
        />
      </Pressable>

      {/* Family Mode Button */}
      <Pressable
        onPress={() => handleToggle('family')}
        style={[
          styles.modeToggleButton,
          lastUsedMode === 'family' && styles.modeToggleButtonSelected,
        ]}
      >
        <MaterialIcons
          name="group"
          size={20}
          style={[
            styles.icon,
            lastUsedMode === 'family' && { color: 'white' },
          ]}
        />
      </Pressable>
    </View>

    {lastUsedMode === 'personal' && (
      <View style={styles.personalModeInfo}>
        <Text style={styles.personalModeInfoText}>
          You are in Personal Mode now. If you want to share your data with other users, switch to the Family Mode.
        </Text>

        <TouchableOpacity
          onPress={onPressDelete}
          disabled={deleting}
          style={styles.dangerTextButton}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          {deleting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.dangerText}>Delete account</Text>
          )}
        </TouchableOpacity>
      </View>
    )}

    {/* Content shown only in family mode */}
    {lastUsedMode === 'family' && (
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>
          <UserSlots
            currentUser={user}
            createInvite={handleCreateInvite}
          />
          {/* Delete Family button at the bottom */}
          {isOwner && (
            <Pressable
              style={styles.deleteFamilyButton}
              onPress={handleDeleteFamily}
            >
              <Text style={styles.deleteFamilyText}>Delete Family</Text>
            </Pressable>
          )}
          {!isOwner && (
            <Pressable
              style={styles.quitFamilyButton}
              onPress={handleQuitFamily}
            >
              <Text style={styles.quitFamilyText}>Quit Family</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    )}
  </View>
  );

}

const styles = StyleSheet.create({
  UserSettingsPage: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  UserSettingsPage_ContentWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionHeader: {
    fontFamily: MainFont_Bold,
    fontSize: 18,
    marginBottom: 8,
    color: '#222',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  usernameText: {
    flex: 1,
    fontFamily: MainFont,
    fontSize: 16,
    color: '#000',
  },
  usernameInput: {
    flex: 1,
    borderColor: '#888',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 16,
    fontFamily: MainFont,
    height: 36,
  },
  editButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  editIcon: {
    paddingHorizontal: 8,
  },
  removeButton: {
    marginLeft: 12,
    padding: 4,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  Text_SwitchMode: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_SemiBold,
  },


  modeToggleContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 20,
  gap: 16,
},

modeToggleButton: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#eee',
  justifyContent: 'center',
  alignItems: 'center',
},

modeToggleButtonSelected: {
  backgroundColor: buttonColor,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
icon: {
  color: greyTextColor,
  fontSize: 24,
},

personalModeInfo: {
  marginTop: 16,
  marginHorizontal: 4,
  padding: 12,
  borderRadius: 8,
},
personalModeInfoText: {
  fontFamily: MainFont_SemiBold,
  fontSize: TextFontSize + 2,
  color: greyTextColor2,
  lineHeight: 20,
  // textAlign: 'center',
},

dangerTextButton: {
  alignSelf: "flex-start",
  paddingVertical: 8,
},
dangerText: {
  color: "#D00",
  fontSize: 16,
  fontWeight: "600",
},
});
