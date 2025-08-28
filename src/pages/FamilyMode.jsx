import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import UserSlots from '../components/usersettings/UserSlots';
import useAuthStore from '../store/authStore';
import { toggleUserMode } from '../store/userAccountStore';

import { createInvite, listInvites /*, revokeInvite */ } from '../store/inviteStore';

import useFamilyStore from '../store/familyStore';
import { deleteFamilyIfOwner, exitFamilyMembership } from '../store/familyStore';

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

// Premium gate (standard)
import PremiumGate from '../components/PremiumGate';
import { usePremiumStore } from '../store/premiumStore';
import UserSettingsPage from './UserSettings';

const { width, height } = Dimensions.get('window');

// Adjust to your real route name for the paywall/subscription page
const SUBSCRIPTION_ROUTE_NAME = 'Subscription';

export default function FamilyModePage() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Inter: require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
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
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  // ── premium (RevenueCat) ──────────────────────────────────────────────
  const isPremium = usePremiumStore((s) => s.isPremium);
  const refreshEntitlements = usePremiumStore((s) => s.refreshEntitlements);
  useEffect(() => {
    // In case App.js hasn’t refreshed yet, do one pull on mount.
    refreshEntitlements?.();
  }, [refreshEntitlements]);

  // ── family store ───────────────────────────────────────────────────────
  const fetchOwnerId = useFamilyStore((state) => state.fetchOwnerId);
  const clearOwnerId = useFamilyStore((state) => state.clearOwnerId);
  const ownerId = useFamilyStore((state) => state.ownerId);

  // Only fetch owner id when premium + in a family
  useEffect(() => {
    if (!isPremium || !familyId) {
      clearOwnerId();
      return;
    }
    const load = async () => {
      await fetchOwnerId(familyId);
    };
    load();
  }, [isPremium, familyId]);

  // ── invites ───────────────────────────────────────────────────────────
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  const loadInvites = async () => {
    if (!isPremium || !familyId) return;
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
            try {
              await deleteAccount();
            } catch (e) {
              Alert.alert('Could not delete account', e && e.message ? e.message : 'Unknown error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── create & share invite (premium only) ───────────────────────────────
  const handleCreateInvite = async () => {
    if (!isPremium) {
      Alert.alert('Premium required', 'Family invites are available with Fridgy Plus.');
      return;
    }
    if (!familyId) {
      Alert.alert('Error', 'You must be in family mode to invite.');
      return;
    }
    try {
      const code = await createInvite({ familyId, ownerId });
      const link = Linking.createURL('invite', { queryParams: { code } });
      await Share.share({ title: 'Join my family', message: `${link}` });
      loadInvites();
    } catch (err) {
      console.error('Create invite failed', err);
      Alert.alert('Error', err.message);
    }
  };

  // ── mode switching with gating ─────────────────────────────────────────
  const handleToggle = useCallback(
    async (targetMode) => {
      if (!user?.uid) {
        Alert.alert('Not logged in');
        return;
      }

      if (targetMode === lastUsedMode) return;

      // Block switching to family if not premium
      if (targetMode === 'family' && !isPremium) {
        Alert.alert('Premium required', 'Family Mode is available with Fridgy Plus.', [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'See subscription',
            onPress: () => navigation.navigate(UserSettingsPage),
          },
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
    [user, lastUsedMode, isPremium, navigation, setFamilyId, setLastUsedMode]
  );

  // ── family deletion / quit ─────────────────────────────────────────────
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

  return (
    <View style={styles.UserSettingsPage}>
      {/* Mode toggle buttons */}
      <View style={styles.modeToggleContainer}>
        {/* Personal Mode Button */}
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

        {/* Family Mode Button — disabled if not premium */}
        <Pressable
          disabled={!isPremium}
          onPress={() => handleToggle('family')}
          style={[
            styles.modeToggleButton,
            lastUsedMode === 'family' && styles.modeToggleButtonSelected,
            !isPremium && styles.modeToggleButtonDisabled,
          ]}
        >
          <MaterialIcons
            name={!isPremium ? 'lock' : 'group'}
            size={20}
            style={[styles.icon, lastUsedMode === 'family' && { color: 'white' }, !isPremium && { color: '#999' }]}
          />
        </Pressable>
      </View>

      {/* Upsell if not premium */}
      

      {/* Personal mode content is always available */}
      {lastUsedMode === 'personal' && (
        <View style={styles.personalModeInfo}>
          <Text style={styles.personalModeInfoText}>
            You are in Personal Mode now. If you want to share your data with other users, switch to the Family Mode.
          </Text>

          {!isPremium && (
            <View style={styles.premiumCallout}>
              <Text style={styles.premiumCalloutTitle}>Family Mode is a Plus feature</Text>
              <Text style={styles.premiumCalloutText}>
                Invite up to 5 members, share lists, and more. Unlock with Fridgy Plus.
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate(UserSettingsPage)} style={styles.premiumCTA}>
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

      {/* Family mode content only when premium (via PremiumGate) AND in family mode */}
      <PremiumGate
        fallback={null /* we already show an upsell above */}
      >
        {lastUsedMode === 'family' && (
          <ScrollView>
            <View style={styles.UserSettingsPage_ContentWrapper}>
              <UserSlots currentUser={user} createInvite={handleCreateInvite} />

              {isOwner ? (
                <Pressable style={styles.dangerTextButton} onPress={handleDeleteFamily}>
                  <Text style={styles.dangerText}>Delete Family</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.quitFamilyButton} onPress={handleQuitFamily}>
                  <Text style={styles.quitFamilyText}>Quit Family</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
      </PremiumGate>
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
