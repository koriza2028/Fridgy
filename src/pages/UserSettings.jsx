// Updated subscription page (pure JavaScript) with RevenueCat offerings.
// Monthly only; Yearly kept commented for later use.
// Assumes Purchases.configure(...) is called at app startup.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';

import Purchases from 'react-native-purchases';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';

import ButtonBouncing from '../components/Button_Bouncing.jsx';

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
  ReceiptFont,
  SecondTitleFontSize,
  SecondTitleFontWeight,
  TextFontSize,
} from '../../assets/Styles/styleVariables';

const { width, height } = Dimensions.get('window');

// Change to your actual entitlement identifier from RevenueCat Dashboard
const ENTITLEMENT_ID = 'Pro';

export default function UserSettingsPage() {
  const [fontsLoaded] = useFonts({
    'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

  const openTerms = () => {
    const url = 'https://freedgytos.carrd.co/';
    Linking.canOpenURL(url)
      .then((supported) => { if (supported) Linking.openURL(url); })
      .catch(() => {});
  };

  const openPrivacy = () => {
    const url = 'https://freedgypp.carrd.co/';
    Linking.canOpenURL(url)
      .then((supported) => { if (supported) Linking.openURL(url); })
      .catch(() => {});
  };

  const openManageSubscriptions = () => {
    const ios = 'https://apps.apple.com/account/subscriptions';
    // const android = 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(Platform.OS === 'ios' ? ios : android).catch(() => {});
  };

  // ---- RevenueCat offerings (Monthly only; Yearly is commented) ----
  const [offering, setOffering] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('Monthly'); // 'annual' kept for later

  useEffect(() => {
    (async () => {
      try {
        // Optional for debugging:
        // Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        const o = await Purchases.getOfferings();
        // console.log('RC Offerings (full):', JSON.stringify(o, null, 2));

        setOffering(o && o.current ? o.current : null);
      } catch (e) {
        console.warn('Error fetching offerings', e);
      } finally {
        setLoadingPrices(false);
      }
    })();
  }, []);

  // Find monthly package robustly
  const monthlyPkg =
    (offering && offering.monthly) ||
    (offering && Array.isArray(offering.availablePackages)
      ? offering.availablePackages.find((p) => {
          const id = String(p && p.identifier ? p.identifier : '').toLowerCase();
          const type = String(p && p.packageType ? p.packageType : '').toLowerCase();
          return id.includes('month') || id.includes('rc_month') || type.includes('month');
        })
      : null);

  // // Yearly (kept for future use)
  // const annualPkg =
  //   (offering && offering.annual) ||
  //   (offering && Array.isArray(offering.availablePackages)
  //     ? offering.availablePackages.find((p) => {
  //         const id = String(p && p.identifier ? p.identifier : '').toLowerCase();
  //         const type = String(p && p.packageType ? p.packageType : '').toLowerCase();
  //         return id.includes('year') || id.includes('rc_annual') || type.includes('year');
  //       })
  //     : null);

  const monthlyProduct = monthlyPkg && (monthlyPkg.product || monthlyPkg.storeProduct);
  // const annualProduct = annualPkg && annualPkg.storeProduct;

  const monthlyPriceStr = monthlyProduct && monthlyProduct.priceString;
  // const annualPriceStr = annualProduct && annualProduct.priceString;

  // // Optional per-month calc for annual
  // let annualPerMonth = '';
  // if (annualProduct && annualProduct.price && annualProduct.currencyCode) {
  //   const per = annualProduct.price / 12;
  //   try {
  //     annualPerMonth = ` (~${new Intl.NumberFormat(undefined, { style: 'currency', currency: annualProduct.currencyCode }).format(per)}/month)`;
  //   } catch (e) {
  //     annualPerMonth = ` (~${(annualProduct.price / 12).toFixed(2)}/month)`;
  //   }
  // }

  const handlePurchase = async () => {
    // Only monthly for now
    const pkg = monthlyPkg; // selectedPlan === 'annual' ? annualPkg : monthlyPkg;
    if (!pkg) {
      Alert.alert('Not available', 'Prices are not available yet. Please try again.');
      return;
    }
    try {
      const result = await Purchases.purchasePackage(pkg);
      const customerInfo = result && result.customerInfo ? result.customerInfo : null;
      if (customerInfo && customerInfo.entitlements && customerInfo.entitlements.active && customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        Alert.alert('Success', "You're now a premium user!");
      }
    } catch (e) {
      // RevenueCat error has e.userCancelled for user cancellations
      if (!(e && e.userCancelled)) {
        Alert.alert('Purchase failed', (e && e.message) ? e.message : 'Unknown error');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      // Returns CustomerInfo
      const customerInfo = await Purchases.restorePurchases();

      // Helpful during review / debugging
      console.log('[Restore] customerInfo:', JSON.stringify({
        entitlements: {
          active: Object.keys(customerInfo?.entitlements?.active ?? {}),
        },
        allPurchasedProductIdentifiers: customerInfo?.allPurchasedProductIdentifiers,
        latestExpirationDate: customerInfo?.latestExpirationDate,
      }, null, 2));

      const isActive =
        !!customerInfo?.entitlements?.active?.[ENTITLEMENT_ID]?.isActive;

      if (isActive) {
        Alert.alert('Restored', 'Your purchases have been restored.');
      } else {
        // Not active could mean: never purchased on this Apple ID, expired sub, or mismatch of IDs.
        const hadAnyPurchase = (customerInfo?.allPurchasedProductIdentifiers?.length ?? 0) > 0;
        const msg = hadAnyPurchase
          ? 'We found past purchases, but no active entitlement. It may have expired or doesn’t match your current plan.'
          : 'No past purchases were found for this Apple ID on this app.';
        Alert.alert('No purchases', msg);
      }
    } catch (e) {
      // Surface StoreKit/RC messages (useful for Apple review notes)
      const message = (e && (e.message || e.code)) ? `${e.message || e.code}` : 'Unknown error';
      console.warn('[Restore] error:', e);
      Alert.alert('Restore failed', message);
    }
  };


  const buyDisabled = loadingPrices || !monthlyProduct; // || (selectedPlan==='annual' && !annualProduct)

  return (
    <View style={styles.UserSettingsPage}>
      <View style={styles.UserSettingsPage_ContentWrapper}>

        {/* Title of service */}
        <Text style={styles.title}>Unlock all Plus features</Text>
        <Text style={styles.subtitle}>Use app's full potential</Text>

        {/* Premium features list */}
        <View style={styles.listOfPremiumFeatures}>
          <View style={styles.PremiumFeature}>
            <MaterialIcons name="group" size={14} style={styles.PremiumFeature_Icon}/>
            <Text style={styles.PremiumFeature_Text}>Create family account for up to 5 users</Text>
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
            <Text style={styles.PremiumFeature_Text}>Access to the future Plus features for the same price</Text>
          </View>
        </View>

        {/* Plans (Monthly only visible; Yearly commented) */}
        <View style={styles.plans}>
          <Pressable
            onPress={() => setSelectedPlan('Monthly')}
            style={[styles.plan, selectedPlan === 'Monthly' && styles.planHighlight, !monthlyProduct && { opacity: 0.5 }]}
            disabled={!monthlyProduct}
          >
            {selectedPlan === 'Monthly' ? <Text style={styles.badge}>SELECTED</Text> : null}
            <Text style={styles.planTitle}>Monthly plan</Text>
            <Text style={styles.planPrice}>
              {loadingPrices ? 'Loading…' : (monthlyProduct ? (monthlyPriceStr) : 'Unavailable')}
            </Text>
            <Text style={styles.planDetail}>Billed every month</Text>
          </Pressable>


          {/* <Pressable
            onPress={() => setSelectedPlan('annual')}
            style={[styles.plan, selectedPlan === 'annual' && styles.planHighlight, !annualProduct && { opacity: 0.5 }]}
            disabled={!annualProduct}
          >
            {selectedPlan === 'annual' ? <Text style={styles.badge}>SELECTED</Text> : null}
            <Text style={styles.planTitle}>Annual</Text>
            <Text style={styles.planPrice}>
              {loadingPrices ? 'Loading…' : (annualProduct ? (annualPriceStr + '/year' + annualPerMonth) : 'Unavailable')}
            </Text>
            <Text style={styles.planDetail}>Billed yearly</Text>
          </Pressable> */}
        </View>

        {/* Auto-renew disclosure (required) */}
        <View style={{ marginTop: 12, paddingHorizontal: 6 }}>
          <Text style={{ fontSize: 12, color: '#555', textAlign: 'center' }}>
            Subscriptions auto-renew until canceled. Manage them or cancel in Settings &gt; Apple ID &gt; Subscriptions.
          </Text>
          {/* If you offer a free trial, add:
              "Free trial converts to a paid subscription unless canceled at least 24 hours before it ends." */}
        </View>

        {/* CTA */}
        {/* <TouchableOpacity
          style={[styles.upgradeButton, buyDisabled && { opacity: 0.6 }]}
          onPress={handlePurchase}
          disabled={buyDisabled}
        >
          <Text style={styles.upgradeText}>
            {loadingPrices ? 'Loading…' : 'Purchase ' + selectedPlan + ' for ' + monthlyPriceStr}
          </Text>
        </TouchableOpacity> */}

        <ButtonBouncing
          style={[styles.upgradeButton, buyDisabled && { opacity: 0.6 }, {backgroundColor: addButtonColor}]}
          innerStyle={{backgroundColor: addButtonColor, height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 20,}}
          onPress={handlePurchase}
          disabled={buyDisabled}
          label={
            <Text style={styles.upgradeText}>
              {loadingPrices ? 'Loading…' : 'Purchase ' + selectedPlan + ' for ' + monthlyPriceStr}
            </Text>}
          toScale={0.95}
        ></ButtonBouncing>

        {/* Footer: restore, manage, terms, privacy */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={restorePurchases}><Text>Restore Purchases</Text></TouchableOpacity>
          <TouchableOpacity onPress={openTerms}><Text>Terms of Use</Text></TouchableOpacity>
          <TouchableOpacity onPress={openPrivacy}><Text>Privacy Policy</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  UserSettingsPage: { 
    flex: 1, 
    backgroundColor: '#fff',
  },

  UserSettingsPage_ContentWrapper: { 
    padding: 10,
    paddingTop: height*0.1,
    height: height*0.8,
  },

  title: { 
    fontSize: 30, 
    fontWeight: 'bold', 
    textAlign: 'left', 
    marginTop: 10,
    paddingLeft: 10,
  },

  subtitle: { 
    fontSize: 16, 
    color: '#555', 
    textAlign: 'left', 
    marginVertical: 4,
    paddingLeft: 10,
  },

  plans: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20 
  },

  plan: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 10, 
    padding: 16, 
    alignItems: 'center', 
    width: '46%' 
  },

  planHighlight: { 
    borderColor: addButtonColor, 
    backgroundColor: '#F4F2FF' 
  },

  badge: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#fff', 
    backgroundColor: addButtonColor, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 4, 
    position: 'absolute', 
    top: -10 
  },

  planTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },

  planPrice: { 
    fontSize: 16, 
    fontFamily: MainFont_Bold,
    marginBottom: 2 
  },

  planDetail: { 
    fontSize: 12, 
    color: '#666' 
  },

  listOfPremiumFeatures: {
    marginTop: 10,
    padding: 10,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  PremiumFeature_Icon: {
    marginRight: 10,
    fontSize: 20,
    color: addButtonColor,
  },
  PremiumFeature_Text: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontFamily: MainFont,
    fontSize: 14,
    color: blackTextColor,
  },

  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: addButtonColor,
    height: 46,
    width: width*0.8,
    borderRadius: 20,
    borderColor: '#ccc',
    // borderWidth: 1,
    // paddingHorizontal: 10,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center'
  },
  upgradeText: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_SemiBold,
    color: 'white',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 20,
    width: width*0.9,
    alignSelf: 'center',
  }
});
