import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Button,
  Alert,
  FlatList,
  Share,
} from 'react-native';
import * as Linking from 'expo-linking';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import ButtonGoBack from '../components/ButtonGoBack';
import UserSlots from '../components/usersettings/UserSlots';

import useAuthStore from '../store/authStore';
import { toggleUserMode } from '../store/userAccountStore';

import {
  createInvite,
  listInvites,
  revokeInvite,
} from '../store/inviteStore';

import { useFonts } from 'expo-font';
import {
  addButtonColor,
  backgroundColor,
  greyTextColor,
  greyTextColor2,
  MainFont,
  MainFont_Bold,
  SecondTitleFontSize,
  SecondTitleFontWeight,
  TextFontSize,
} from '../../assets/Styles/styleVariables';

const { width } = Dimensions.get('window');

export default function UserSettingsPage() {
  // auth context
  const ctx = useAuthStore((state) => {
    const userId = state.user?.uid;
    // if not family mode, familyId is undefined
    const familyId = state.lastUsedMode === 'family' ? state.familyId : undefined;
    return { userId, familyId };
  });
  const lastUsedMode = useAuthStore((state) => state.lastUsedMode);
  const setFamilyId = useAuthStore((state) => state.setFamilyId);
  const setLastUsedMode = useAuthStore((state) => state.setLastUsedMode);

  // invite management state
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // load invites for this family
  const loadInvites = async () => {
    if (!ctx.familyId) return;
    setLoadingInvites(true);
    try {
      const items = await listInvites({ familyId: ctx.familyId });
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
  }, [ctx.familyId]);

  // create & share invite
  const handleCreateInvite = async () => {
    if (!ctx.familyId) {
      Alert.alert('Error', 'You must be in family mode to invite.');
      return;
    }
    try {
      const code = await createInvite({ familyId: ctx.familyId });
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

  // revoke invite
  const handleRevoke = (code) => async () => {
    try {
      await revokeInvite(code);
      Alert.alert('Invite revoked');
      loadInvites();
    } catch (err) {
      console.error('Revoke failed', err);
      Alert.alert('Error', 'Could not revoke invite');
    }
  };

  // original toggle logic commented out; replaced with simplified call
  const handleToggle = async () => {
    /* OLD:
    const userId = useAuthStore.getState().user?.uid;
    const current = useAuthStore.getState().lastUsedMode;
    if (!userId) { Alert.alert("Not logged in"); return; }
    try {
      const res = await toggleUserMode({ userId, currentMode: current });
      setFamilyId(res.familyId);
      setLastUsedMode(res.mode);
      Alert.alert("Success", res.mode==="family"?`Switched to Family ID: ${res.familyId}`:"Switched to Personal Mode");
    } catch(e){ Alert.alert("Error", e.message); }
    */

    // NEW:
    const { user, lastUsedMode: mode } = useAuthStore.getState();
    if (!user?.uid) {
      Alert.alert("Not logged in");
      return;
    }
    try {
      const res = await toggleUserMode({ userId: user.uid, currentMode: mode });
      setFamilyId(res.familyId);
      setLastUsedMode(res.mode);
      Alert.alert(
        "Success",
        res.mode === "family"
          ? `Switched to Family ID: ${res.familyId}`
          : "Switched to Personal Mode"
      );
    } catch (e) {
      console.error("Toggle failed:", e);
      Alert.alert("Error", e.message);
    }
  };

  const nextMode =
    lastUsedMode === 'family'
      ? 'Switch to Personal Mode'
      : 'Switch to Family Mode';

  return (
    <View style={styles.UserSettingsPage}>
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>
          {/* Family mode toggle */}
          <View style={{ marginVertical: 16 }}>
            <Button title={nextMode} onPress={handleToggle} />
          </View>

          {/* Invite controls */}
          <View style={styles.inviteSection}>
            <Text style={styles.sectionHeader}>Family Invitations</Text>
            <Button title="Create & Share Invite" onPress={handleCreateInvite} />
            {loadingInvites ? (
              <Text style={styles.loading}>Loading…</Text>
            ) : (
              <FlatList
                data={invites}
                keyExtractor={(item) => item.id}
                style={styles.inviteList}
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
          </View>

          {/* Existing UI */}
          <Text style={[styles.SectionHeader]}>Features offered by premium:</Text>
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
          {/* … rest of your premium features … */}
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
  inviteList: {
    marginTop: 8,
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
  // … keep existing styles …
});
