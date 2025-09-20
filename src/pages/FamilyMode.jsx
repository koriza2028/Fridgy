import React, { useState, useEffect, useCallback} from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, Pressable, Share, Alert, StyleSheet, Dimensions,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import UserSlots from '../components/usersettings/UserSlots';
import useAuthStore from '../store/authStore';
import { toggleUserMode } from '../store/userAccountStore';

import { createInvite, listInvites /*, revokeInvite */ } from '../store/inviteStore';

import useFamilyStore from '../store/familyStore';
import { deleteFamilyIfOwner, exitFamilyMembership } from '../store/familyStore';

import { useFonts } from 'expo-font';
import {
  addButtonColor, backgroundColor, blackTextColor, buttonColor, greyTextColor,
  greyTextColor2, MainFont, MainFont_Bold, MainFont_SemiBold, SecondTitleFontSize,
  SecondTitleFontWeight, TextFontSize,
} from '../../assets/Styles/styleVariables';

// Premium (new combined store)
import { usePremiumStore } from '../store/premiumStore';

const { width, height } = Dimensions.get('window');
const SUBSCRIPTION_ROUTE_NAME = 'Subscription';

export default function FamilyModePage() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Inter: require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

  // ── auth context ──────────────────────────────────────────────────────
  const { familyId, user, lastUsedMode } = useAuthStore((s) => ({
    familyId: s.familyId,
    user: s.user,
    lastUsedMode: s.lastUsedMode,
  }));
  const setFamilyId = useAuthStore((s) => s.setFamilyId);
  const setLastUsedMode = useAuthStore((s) => s.setLastUsedMode);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  // ── premium (combined) ────────────────────────────────────────────────
  const rcLoaded = usePremiumStore(s => s.rcLoaded);
  const rcActive = usePremiumStore((s) => s.isPremium);
  const { familyPremiumActive, familyPremiumLoaded, guardPauseUntil } = useFamilyStore(s => ({
    familyPremiumActive: s.familyPremiumActive,
    familyPremiumLoaded: s.familyPremiumLoaded,
    guardPauseUntil: s.guardPauseUntil,
  }));

  const grace = Date.now() < (guardPauseUntil || 0);

  const canUseFamilyMode =
    (!rcLoaded || !familyPremiumLoaded)
      ? undefined
      : (!!familyId && (rcActive || familyPremiumActive || grace));
  const refreshEntitlements = usePremiumStore((s) => s.refreshEntitlements);
  useEffect(() => { refreshEntitlements?.(); }, [refreshEntitlements]);

  // ── family store ───────────────────────────────────────────────────────
  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);

  // Fetch owner id only when in a family (no longer blocking on personal premium)
  useEffect(() => {
    if (!familyId) { clearOwnerId(); return; }
    (async () => { await fetchOwnerId(familyId); })();
  }, [familyId]);

  useFocusEffect(   
    React.useCallback(() => {
      if (!familyId) return;
      const noPremiumVisible = !rcActive && !familyPremiumActive;
      if (noPremiumVisible) {
        try {
          const s = useFamilyStore.getState();
          s.pauseGuard(12000); // 12s is plenty
          s.syncFamilyPremiumNow?.(familyId)?.catch(() => {});
        } catch {}
      }
     // no cleanup needed
    }, [familyId, rcActive, familyPremiumActive])
  );

  useEffect(() => {
    if (lastUsedMode !== 'family' || !user?.uid) return;
    if (!rcLoaded || !familyPremiumLoaded) return;            // still loading → do nothing
    if (Date.now() < (guardPauseUntil || 0)) return;          // grace window → do nothing

    if (canUseFamilyMode === false) {
      useAuthStore.getState().setLastUsedMode('personal');
      Alert.alert('Access changed', 'Your Family Mode access has been revoked.');
    }
  }, [lastUsedMode, canUseFamilyMode, rcLoaded, familyPremiumLoaded, guardPauseUntil, user?.uid]);

  // ── invites ───────────────────────────────────────────────────────────
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const loadInvites = async () => {
    // Only owner sees invite list / can create
    if (!familyId || user?.uid !== ownerId) return;
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

  // ── account deletion ──────────────────────────────────────────────────
  const [deleting, setDeleting] = useState(false);
  const onPressDelete = () => {
    Alert.alert(
      'Delete account?',
      'This cannot be undone. If you own a family, deletion will be blocked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try { await deleteAccount(); }
            catch (e) { Alert.alert('Could not delete account', e?.message ?? 'Unknown error'); }
            finally { setDeleting(false); }
          },
        },
      ]
    );
  };

    // ── create & share invite (owner only) ────────────────────────────────
    // in FamilyModePage
  const handleCreateInvite = async () => {
    if (!familyId) { Alert.alert('Error', 'You must be in a family to invite.'); return; }
    if (user?.uid !== ownerId) { Alert.alert('Owner only', 'Only the family owner can create invites.'); return; }

    // 👇 prevent the “locked” flash while the app bounces to the Share sheet
    try { useFamilyStore.getState().pauseGuard(12000); } catch {}

    try {
      const code = await createInvite({ familyId, ownerId });
      const link = Linking.createURL('invite', { queryParams: { code } });
      await Share.share({ title: 'Join my family', message: `${link}` });

      // optional: kick a best-effort RC→family sync when you return
      setTimeout(() => {
        try { useFamilyStore.getState().syncFamilyPremiumNow?.(familyId); } catch {}
      }, 0);

      loadInvites();
    } catch (err) {
      console.error('Create invite failed', err);
      Alert.alert('Error', err.message);
    }
  };


  // ── mode switching with gating (use hasPlus) ──────────────────────────
  const handleToggle = useCallback(
    async (targetMode) => {
      if (!user?.uid) { Alert.alert('Not logged in'); return; }
      if (targetMode === lastUsedMode) return;
      if (targetMode === 'family' && !canUseFamilyMode) {
        Alert.alert('Plus required', 'Family Mode is available with Fridgy Plus.', [
          { text: 'Not now', style: 'cancel' },
          { text: 'See subscription', onPress: () => navigation.navigate(SUBSCRIPTION_ROUTE_NAME) },
        ]);
        return;
      }

      try {
        const res = await toggleUserMode({ userId: user.uid, lastUsedMode });
        setFamilyId(res.familyId);
        setLastUsedMode(res.mode);
      } catch (e) {
        console.error('Toggle failed:', e);
        Alert.alert('Error', e.message);
      }
    },
    [user, lastUsedMode, canUseFamilyMode, navigation, setFamilyId, setLastUsedMode]
  );

  // ── family deletion / quit ────────────────────────────────────────────
  const handleDeleteFamily = async () => {
    Alert.alert('Delete Family', 'Are you sure you want to delete the entire family?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFamilyIfOwner({ familyId, requesterId: user.uid });
            clearOwnerId();
            setFamilyId(null);
            setLastUsedMode('personal');
            Alert.alert('Deleted', 'Family has been deleted.');
          } catch (err) {
            console.error('Failed to delete family', err);
            Alert.alert('Error', 'Failed to delete family');
          }
        },
      },
    ]);
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
              setFamilyId(null);
              setLastUsedMode('personal');
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

  const isOwner = user?.uid === ownerId;

  // UI lock for family mode button now uses hasPlus (combined)
  const familyModeDisabled = !canUseFamilyMode;

  return (
    <View style={styles.UserSettingsPage}>
      {/* Mode toggle */}
      <View style={styles.modeToggleContainer}>
        <Pressable
          onPress={() => handleToggle('personal')}
          style={[styles.modeToggleButton, lastUsedMode === 'personal' && styles.modeToggleButtonSelected]}
        >
          <MaterialIcons
            name="person-outline"
            size={20}
            style={[styles.icon, lastUsedMode === 'personal' && { color: 'white' }]}
          />
        </Pressable>

        <Pressable
          disabled={familyModeDisabled}
          onPress={() => handleToggle('family')}
          style={[
            styles.modeToggleButton,
            lastUsedMode === 'family' && styles.modeToggleButtonSelected,
            familyModeDisabled && styles.modeToggleButtonDisabled,
          ]}
        >
          <MaterialIcons
            name={familyModeDisabled ? 'lock' : 'group'}
            size={20}
            style={[
              styles.icon,
              lastUsedMode === 'family' && { color: 'white' },
              familyModeDisabled && { color: '#999' },
            ]}
          />
        </Pressable>
      </View>

      {/* Personal mode content */}
      {lastUsedMode === 'personal' && (
        <View style={styles.personalModeInfo}>
          <Text style={styles.personalModeInfoText}>
            You are in Personal Mode now. If you want to share your data with other users, switch to the Family Mode.
          </Text>

          {!canUseFamilyMode && (
            <View style={styles.premiumCallout}>
              <Text style={styles.premiumCalloutTitle}>Family Mode is a Plus feature</Text>
              <Text style={styles.premiumCalloutText}>
                Invite up to 5 members, share lists, and more. Unlock with Fridgy Plus.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(SUBSCRIPTION_ROUTE_NAME)}
                style={styles.premiumCTA}
              >
                <Text style={styles.premiumCTAText}>See subscription options</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={onPressDelete}
            disabled={deleting}
            style={styles.dangerTextButton}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            {deleting ? <ActivityIndicator /> : <Text style={styles.dangerText}>Delete account</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Family mode content (render only when in family mode and Plus is active — personal or family) */}
      {lastUsedMode === 'family' && canUseFamilyMode && (
        <ScrollView>
          <View style={styles.UserSettingsPage_ContentWrapper}>
            <UserSlots currentUser={user} createInvite={handleCreateInvite} />

            {isOwner ? (
              <>
                <Pressable style={styles.secondaryButton} onPress={loadInvites}>
                  <Text style={styles.secondaryText}>
                    {loadingInvites ? 'Loading invites…' : `Refresh invites (${invites.length})`}
                  </Text>
                </Pressable>

                <Pressable style={styles.primaryButton} onPress={handleCreateInvite}>
                  <Text style={styles.primaryText}>Create Invite</Text>
                </Pressable>

                <Pressable style={styles.dangerTextButton} onPress={handleDeleteFamily}>
                  <Text style={styles.dangerText}>Delete Family</Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={styles.quitFamilyButton} onPress={handleQuitFamily}>
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

  // Toggle buttons
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
  modeToggleButtonDisabled: {
    backgroundColor: '#f2f2f2',
  },
  icon: {
    color: greyTextColor,
    fontSize: 24,
  },

  // Personal mode info
  personalModeInfo: {
    marginTop: 16,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
  },
  personalModeInfoText: {
    fontFamily: MainFont,
    fontSize: TextFontSize + 2,
    color: greyTextColor2,
    lineHeight: 20,
  },

  // Danger buttons
  dangerTextButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  dangerText: {
    color: '#D00',
    fontSize: 16,
    fontWeight: '600',
  },

  // Quit family (additions to avoid missing styles)
  quitFamilyButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  quitFamilyText: {
    color: '#D00',
    fontSize: 16,
    fontWeight: '600',
  },

  // Premium upsell
  premiumCallout: {
    marginTop: 16,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f7f7fb',
  },
  premiumCalloutTitle: {
    fontFamily: MainFont_Bold,
    fontSize: TextFontSize + 2,
    color: '#222',
    marginBottom: 4,
  },
  premiumCalloutText: {
    fontFamily: MainFont,
    fontSize: TextFontSize,
    color: greyTextColor2,
  },
  premiumCTA: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: addButtonColor,
  },
  premiumCTAText: {
    color: '#fff',
    fontFamily: MainFont_SemiBold,
  },
});
