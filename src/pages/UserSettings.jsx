// pages/UserSettingsPage.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Button,
  Pressable,
  Share,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Linking as RNLinking } from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import UserSlots from '../components/usersettings/UserSlots';
import useAuthStore from '../store/authStore';
import { toggleUserMode } from '../store/userAccountStore';

import {
  createInvite,
  listInvites,
  revokeInvite,
} from '../store/inviteStore';

import {
  exitFamilyMembership,
  removeFamilyMember,
} from '../store/familyStore';

import useFamilyStore from '../store/familyStore';

import { useFonts } from 'expo-font';
import {
  addButtonColor,
  backgroundColor,
  greyTextColor,
  MainFont,
  MainFont_Bold,
} from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

export default function UserSettingsPage() {
  // ── auth context ──────────────────────────────────────────────────────
  const { userId, familyId } = useAuthStore((s) => ({
    userId: s.user?.uid,
    familyId: s.lastUsedMode === 'family' ? s.familyId : undefined,
  }));
  const lastUsedMode = useAuthStore((s) => s.lastUsedMode);
  const setFamilyId = useAuthStore((s) => s.setFamilyId);
  const setLastUsedMode = useAuthStore((s) => s.setLastUsedMode);
  // ───────────────────────────────────────────────────────────────────────

  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);  // ───────────────────────────────────────────────────────────────────────

  // ── fetch family ownerId from Firestore ────────────────────────────────
  useEffect(() => {
    if (!familyId) {
      clearOwnerId();
      return;
    }

    fetchOwnerId(familyId);
  }, [familyId]);

  const ownerId = useFamilyStore((state) => state.ownerId);

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
  useEffect(() => {
    loadInvites();
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
    } catch (e) {
      console.error('Toggle failed:', e);
      Alert.alert('Error', e.message);
    }
  };
  const nextMode =
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
    } catch (err) {
      console.error('Leave family failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── remove a member (owner only) ────────────────────────────────────
  const handleRemoveMember = (memberId) => async () => {
    try {
      await removeFamilyMember({
        ownerId: userId,
        familyId,
        memberId,
      });
      Alert.alert('Success', 'Member removed');
    } catch (err) {
      console.error('Remove member failed', err);
      Alert.alert('Error', err.message);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  // ── deep-link listener ────────────────────────────────────────────────
  const [pendingCode, setPendingCode] = useState(null);
  const PENDING_INVITE_KEY = 'pendingInviteCode';

  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (!url) return;
      const { path, queryParams } = Linking.parse(url);
      if (path === 'invite' && queryParams?.code) {
        const code = queryParams.code;
        Alert.alert('Invite Received', `Invite code: ${code}`);
        setPendingCode(code);

        // consume immediately if already logged in
        const st = useAuthStore.getState();
        if (st.user?.uid) {
          acceptInvite({ userId: st.user.uid }, code)
            .then((famId) => {
              setFamilyId(famId);
              setLastUsedMode('family');
              Alert.alert('Joined family!', `Family ID: ${famId}`);
            })
            .catch((e) => Alert.alert('Invite Error', e.message));
          return;
        }

        // otherwise stash for login
        AsyncStorage.setItem(PENDING_INVITE_KEY, code);
      }
    };

    Linking.getInitialURL().then((u) => u && handleUrl({ url: u }));
    const subscription = RNLinking.addListener('url', handleUrl);
    return () => subscription.remove();
  }, []);

  // ── consume on login ───────────────────────────────────────────────────
  useEffect(() => {
    if (!useAuthStore.getState().user?.uid || !pendingCode) return;
    (async () => {
      try {
        const famId = await acceptInvite(
          { userId: useAuthStore.getState().user.uid },
          pendingCode
        );
        setFamilyId(famId);
        setLastUsedMode('family');
        Alert.alert('Joined family!', `Family ID: ${famId}`);
        await AsyncStorage.removeItem(PENDING_INVITE_KEY);
        setPendingCode(null);
      } catch (err) {
        console.error('Invite accept failed', err);
        Alert.alert('Invite Error', err.message);
      }
    })();
  }, [pendingCode]);
  // ───────────────────────────────────────────────────────────────────────

  // ── load fonts ────────────────────────────────────────────────────────
  useFonts({
    Inter: require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
  });
  // ───────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.UserSettingsPage}>
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>
          {/* mode toggle */}
          <View style={{ marginVertical: 16 }}>
            <Button title={nextMode} onPress={handleToggle} />
          </View>

          {/* invite controls */}
          <View style={styles.inviteSection}>
            <Text style={styles.sectionHeader}>Family Invitations</Text>
            <Button title="Create & Share Invite" onPress={handleCreateInvite} />
            {loadingInvites ? (
              <Text style={styles.loading}>Loading…</Text>
            ) : (
              <FlatList
                data={invites}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.inviteRow}>
                    <Text style={styles.code}>Code: {item.id}</Text>
                    <Pressable
                      style={styles.revokeButton}
                      onPress={handleRevoke(item.id)}
                    >
                      <Text style={styles.revokeText}>Revoke</Text>
                    </Pressable>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>No active invites</Text>
                }
              />
            )}

            {/* leave family */}
            {familyId && (
              <View style={{ marginTop: 12 }}>
                <Button
                  title="Leave Family"
                  color="#e53e3e"
                  onPress={handleLeaveFamily}
                />
              </View>
            )}
          </View>

          {/* premium features UI… */}
          <Text style={[styles.SectionHeader]}>
            Features offered by premium:
          </Text>
          <Text style={styles.PremiumSubHeader}>
            Get all this for just 3.21/month or 24.6/year
          </Text>
          <View style={styles.PremiumFeature}>
            <FontAwesome6
              name="people-pulling"
              size={14}
              style={styles.PremiumFeature_Icon}
            />
            <Text style={styles.PremiumFeature_Text}>
              Share your content with other users
            </Text>
          </View>
          <UserSlots />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  UserSettingsPage: {
    flex: 1,
    backgroundColor: backgroundColor,
    alignItems: 'center',
    width: width,
  },
  UserSettingsPage_ContentWrapper: {
    width: width,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontFamily: MainFont_Bold,
    fontSize: 16,
    marginVertical: 8,
  },
  inviteSection: {
    marginBottom: 24,
  },
  loading: {
    marginTop: 8,
    fontFamily: MainFont,
    color: greyTextColor,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  code: {
    fontFamily: MainFont,
  },
  revokeButton: {
    padding: 6,
    backgroundColor: '#e53e3e',
    borderRadius: 4,
  },
  revokeText: {
    color: '#fff',
    fontFamily: MainFont,
  },
  empty: {
    marginTop: 8,
    fontFamily: MainFont,
    color: greyTextColor,
  },
  SectionHeader: {
    fontFamily: MainFont_Bold,
    fontSize: 18,
    marginTop: 16,
  },
  PremiumSubHeader: {
    fontFamily: MainFont,
    fontSize: 14,
    color: greyTextColor,
    marginBottom: 8,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  PremiumFeature_Icon: {
    marginRight: 10,
    color: addButtonColor,
  },
  PremiumFeature_Text: {
    fontFamily: MainFont_Bold,
    fontSize: 16,
  },
});
