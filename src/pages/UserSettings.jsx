import React, { useState, useEffect } from 'react';
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

import {
  exitFamilyMembership,
} from '../store/familyStore';

import useFamilyStore from '../store/familyStore';

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

const { width } = Dimensions.get('window');

export default function UserSettingsPage() {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

  // ── auth context ──────────────────────────────────────────────────────
  const { userId, familyId, user } = useAuthStore((s) => ({
    userId: s.user?.uid,
    familyId: s.lastUsedMode === 'family' ? s.familyId : undefined,
    user: s.user,
  }));
  const lastUsedMode = useAuthStore((s) => s.lastUsedMode);
  const setFamilyId = useAuthStore((s) => s.setFamilyId);
  const setLastUsedMode = useAuthStore((s) => s.setLastUsedMode);
  // ───────────────────────────────────────────────────────────────────────

  // ── family store ───────────────────────────────────────────────────────
  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);

  const familyMembers = useFamilyStore((state) => state.familyMembers);
  const setFamilyMembers = useFamilyStore((state) => state.setFamilyMembers);
  const fetchFamilyMembers = useFamilyStore((state) => state.fetchFamilyMembers);

  const isOwner = ownerId === userId;

  // usage
  useEffect(() => {
    fetchFamilyMembers(familyId);
  }, [familyId]);

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

  // ── load family members ───────────────────────────────────────────────
  const loadFamilyMembers = async () => {
    if (!familyId) {
      setFamilyMembers([]);
      return;
    }
    try {
      const members = await fetchFamilyMembers(familyId);
      setFamilyMembers(members);
      // Initialize usernameEdits for editing UI
      const initialEdits = {};
      members.forEach((m) => {
        initialEdits[m.userId] = m.username || '';
      });
      setUsernameEdits(initialEdits);
    } catch (err) {
      console.error('Failed to load family members', err);
      Alert.alert('Error', 'Could not load family members');
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── fetch ownerId and members on familyId change ───────────────────────
  useEffect(() => {
    if (!familyId) {
      clearOwnerId();
      setFamilyMembers([]);
      return;
    }
    fetchOwnerId(familyId);
    loadFamilyMembers();
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
        message: `Use this link to join: ${link}`,
      });
      loadInvites();
    } catch (err) {
      console.error('Create invite failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── revoke invite ─────────────────────────────────────────────────────
  const handleRevoke = (inviteId) => async () => {
    try {
      await revokeInvite(inviteId);
      loadInvites();
    } catch (err) {
      console.error('Revoke failed', err);
      Alert.alert('Error', 'Could not revoke invite');
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── toggle personal/family ────────────────────────────────────────────
  const handleToggle = async () => {
    const { user, lastUsedMode: mode } = useAuthStore.getState();
    if (!user?.uid) {
      Alert.alert('Not logged in');
      return;
    }
    try {
      const res = await toggleUserMode({
        userId: user.uid,
        currentMode: mode,
      });
      setFamilyId(res.familyId);
      setLastUsedMode(res.mode);
      Alert.alert(
        'Success',
        res.mode === 'family'
          ? `Switched to Family ID: ${res.familyId}`
          : 'Switched to Personal Mode'
      );
      loadInvites();
      if (res.mode === 'family') {
        loadFamilyMembers();
      } else {
        setFamilyMembers([]);
      }
    } catch (e) {
      console.error('Toggle failed:', e);
      Alert.alert('Error', e.message);
    }
  };
  const changeMode =
    lastUsedMode === 'family'
      ? 'Switch to Personal Mode'
      : 'Switch to Family Mode';
  // ───────────────────────────────────────────────────────────────────────

  // ── leave family (any member) ────────────────────────────────────────
  const handleLeaveFamily = async () => {
    try {
      await exitFamilyMembership({ userId, familyId });
      setFamilyId(null);
      setLastUsedMode('personal');
      Alert.alert('Success', 'You have left the family');
      setFamilyMembers([]);
    } catch (err) {
      console.error('Leave family failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────


  // ───────────────────────────────────────────────────────────────────────

  // ── username editing handlers ────────────────────────────────────────
  const startEditing = (editUserId) => {
    setEditingUserIds((prev) => new Set(prev).add(editUserId));
  };
  const cancelEditing = (editUserId) => {
    setUsernameEdits((prev) => ({
      ...prev,
      [editUserId]: familyMembers.find((m) => m.userId === editUserId)?.username || '',
    }));
    setEditingUserIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(editUserId);
      return newSet;
    });
  };
  const onUsernameChange = (editUserId, newUsername) => {
    setUsernameEdits((prev) => ({ ...prev, [editUserId]: newUsername }));
  };
  const saveUsername = async (editUserId) => {
    const newUsername = usernameEdits[editUserId]?.trim();
    if (!newUsername) {
      Alert.alert('Username cannot be empty');
      return;
    }
    try {
      await setUsername({ userId: editUserId, username: newUsername });
      Alert.alert('Success', 'Username updated');
      // Update local family members username too
      loadFamilyMembers();
      setEditingUserIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(editUserId);
        return newSet;
      });
    } catch (err) {
      console.error('Username change failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.UserSettingsPage}>
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>
          {/* mode toggle */}
            <Pressable title={changeMode} onPress={handleToggle}>
            <Text style={styles.Text_SwitchMode}>
              {lastUsedMode === 'family'
                ? 'You are in Family Mode'
                : 'You are in Personal Mode'}
            </Text>
            </Pressable>


          {/* Leave family */}
          {familyId && !isOwner && (
            <View style={{ marginBottom: 24 }}>
              <Button
                title="Leave Family"
                color="red"
                onPress={() =>
                  Alert.alert(
                    'Leave Family',
                    'Are you sure you want to leave the family?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: handleLeaveFamily },
                    ]
                  )
                }
              />
            </View>
          )}

          {/* Username editing for current user (duplicate, optional) */}
          <UserSlots currentUser={user} members={familyMembers} createInvite={handleCreateInvite}/>

          {/* Premium Features placeholder (keep your original) */}
          <View style={styles.listOfPremiumFeatures}>

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="group" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Unlock family account for up to 5 users</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="photo-camera" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Upload your own pictures</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <Entypo name="calendar" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Unlimited dates for Meal Planner</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <MaterialIcons name="shopping-basket" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Unlimited Autobasket size</Text>
            </View>

            <View style={styles.PremiumFeature}>
              <Entypo name="infinity" size={14} style={styles.PremiumFeature_Icon}/>
              <Text style={styles.PremiumFeature_Text}>Access to the future premium features for the same price</Text>
            </View>

            <Text style={styles.explanationHint}>* Why cannot these features be free? (i)</Text>
            {/* Include a short explanation here about the costs of running the app, e.g. server costs, development time, etc. */}
            <Pressable style={styles.upgradeButton}>
              <FontAwesomeIcons name="long-arrow-up" style={[styles.PremiumFeature_Icon, styles.upgradeIcon]}/>
              <Text style={styles.upgradeText}>Upgrade to Premium</Text>
              <FontAwesomeIcons name="long-arrow-up" style={[styles.PremiumFeature_Icon, styles.upgradeIcon]}/>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  SectionHeader: {
    fontSize: SecondTitleFontSize + 2,
    fontWeight: SecondTitleFontWeight,
    marginTop: 10,
    fontFamily: MainFont_Bold
  },
  PremiumSubHeader: {
    fontSize: 14,
    fontFamily: MainFont,
    color: greyTextColor2,
  },
  Text_SwitchMode: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_SemiBold,
  },
  listOfPremiumFeatures: {
    marginTop: 10,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  PremiumFeature_Icon: {
    marginRight: 10,
    fontSize: 18,
    color: addButtonColor,
  },
  PremiumFeature_Text: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontFamily: MainFont_SemiBold,
    fontSize: TextFontSize + 2,
    color: blackTextColor,
  },
  explanationHint: {
    marginTop: 10,
    fontSize: TextFontSize,
    fontFamily: MainFont,
    color: greyTextColor2,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: addButtonColor,
    height: 42,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  upgradeText: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_Bold,
    color: 'white',
  },
  upgradeIcon: {
    color: 'white',
    marginHorizontal: 10,
    fontSize: TextFontSize + 4,
  },
});
