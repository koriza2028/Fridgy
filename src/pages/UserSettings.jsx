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
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as Linking from 'expo-linking';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import UserSlots from '../components/usersettings/UserSlots';
import useAuthStore from '../store/authStore';
import { toggleUserMode, changeUsername } from '../store/userAccountStore';

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
      setFamilyMembers([]);
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
      // Reload members list after removal
      loadFamilyMembers();
    } catch (err) {
      console.error('Remove member failed', err);
      Alert.alert('Error', err.message);
    }
  };
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
      await changeUsername({ userId: editUserId, newUsername });
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

  // ── deep-link listener, invite acceptance, fonts etc. omitted for brevity ─
  // (You can keep all your original deep-linking and font loading logic here unchanged)
  // ───────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.UserSettingsPage}>
      <ScrollView>
        <View style={styles.UserSettingsPage_ContentWrapper}>
          {/* mode toggle */}
          <View style={{ marginVertical: 16 }}>
            <Button title={nextMode} onPress={handleToggle} />
          </View>

          {/* Family members list */}
          {familyId && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionHeader}>Family Members</Text>
              <FlatList
                data={familyMembers}
                keyExtractor={(item) => item.userId}
                renderItem={({ item }) => {
                  const isOwner = ownerId === userId;
                  const isMemberOwner = item.userId === ownerId;
                  const isEditing = editingUserIds.has(item.userId);

                  return (
                    <View style={styles.memberRow}>
                      {isEditing ? (
                        <>
                          <TextInput
                            style={styles.usernameInput}
                            value={usernameEdits[item.userId]}
                            onChangeText={(txt) => onUsernameChange(item.userId, txt)}
                            autoFocus
                          />
                          <View style={styles.editButtons}>
                            <Button
                              title="Save"
                              onPress={() => saveUsername(item.userId)}
                            />
                            <Button
                              title="Cancel"
                              onPress={() => cancelEditing(item.userId)}
                            />
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={styles.usernameText}>{item.username || '(no name)'}</Text>
                          {item.userId === userId && (
                            <Pressable onPress={() => startEditing(item.userId)} style={styles.editIcon}>
                              <MaterialIcons name="edit" size={20} color="#444" />
                            </Pressable>
                          )}
                        </>
                      )}

                      {isOwner && !isMemberOwner && (
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              'Remove Member',
                              `Remove ${item.username || 'this member'} from family?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Remove',
                                  style: 'destructive',
                                  onPress: handleRemoveMember(item.userId),
                                },
                              ]
                            );
                          }}
                          style={styles.removeButton}
                        >
                          <FontAwesome6 name="user-xmark" size={22} color="red" />
                        </Pressable>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          )}

          {/* Leave family */}
          {familyId && (
            <View style={{ marginBottom: 24 }}>
              <Button
                title="Leave Family"
                color="red"
                onPress={() =>
                  Alert.alert(
                    'Leave Family',
                    'Are you sure you want to leave this family?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: handleLeaveFamily },
                    ]
                  )
                }
              />
            </View>
          )}

          {/* Invite link create & revoke */}
          {familyId && (
            <View style={{ marginBottom: 24 }}>
              <Button
                title="Create Invite Link"
                onPress={handleCreateInvite}
                color={addButtonColor}
              />
              <Text style={styles.sectionHeader}>Active Invites</Text>
              {loadingInvites && <Text>Loading invites...</Text>}
              {!loadingInvites && invites.length === 0 && (
                <Text style={{ fontStyle: 'italic' }}>No active invites.</Text>
              )}
              {!loadingInvites &&
                invites.map((inv) => (
                  <View
                    key={inv.id}
                    style={styles.inviteRow}
                  >
                    <Text style={{ flex: 1 }}>{inv.code}</Text>
                    <Button
                      title="Revoke"
                      onPress={handleRevoke(inv.id)}
                      color="red"
                    />
                  </View>
                ))}
            </View>
          )}

          {/* Username editing for current user (duplicate, optional) */}
          <UserSlots currentUser={user} members={familyMembers}/>

          {/* Premium Features placeholder (keep your original) */}
          {/* ... your premium features and other UI ... */}
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
});
