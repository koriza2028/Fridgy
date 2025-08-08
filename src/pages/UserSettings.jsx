import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import * as Linking from 'expo-linking';

import Purchases from 'react-native-purchases';

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
  ReceiptFont,
  SecondTitleFontSize,
  SecondTitleFontWeight,
  TextFontSize,
} from '../../assets/Styles/styleVariables';

const { width, height } = Dimensions.get('window');


export default function UserSettingsPage() {

  const [fontsLoaded] = useFonts({
      'Inter': require('../../assets/fonts/Inter/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter/Inter_18pt-Bold.ttf'),
      'Inter-SemiBold': require('../../assets/fonts/Inter/Inter_18pt-SemiBold.ttf'),
  });

  // const [offering, setOffering] = useState(null);

  // useEffect(() => {
  //   const fetchOfferings = async () => {
  //     try {
  //       const offerings = await Purchases.getOfferings();
  //       if (offerings.current) {
  //         setOffering(offerings.current);
  //       } else {
  //         console.warn("No current offering available");
  //       }
  //     } catch (e) {
  //       console.warn("Error fetching offerings", e);
  //     }
  //   };

  //   fetchOfferings();
  // }, []);

  // const handlePurchase = async () => {
  //   if (!offering) {
  //     Alert.alert("Please try again later", "No subscription options available at the moment.");
  //     return;
  //   }

  //   const packageToBuy = offering.availablePackages[0]; // Or pick by identifier

  //   try {
  //     const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

  //     if (customerInfo.entitlements.active['com.CreativeMinds.Fridgy.Monthly']) {
  //       Alert.alert("Success", "You're now a premium user!");
  //       // optionally trigger update in state/store
  //     }
  //   } catch (e) { 
  //     if (!e.userCancelled) {
  //       Alert.alert("Purchase failed", e.message);
  //     }
  //   }
  // };

  
  const premiumFeatures = [
  {
    icon: <MaterialIcons name="group" size={14} style={styles.PremiumFeature_Icon} />,
    label: 'Invite up to 5 members to your family account',
    base: '–',
    premium: '✓',
  },
  {
    icon: <MaterialIcons name="photo-camera" size={14} style={styles.PremiumFeature_Icon} />,
    label: 'Upload own pictures',
    base: '–',
    premium: '✓',
  },
  {
    icon: <Entypo name="calendar" size={14} style={styles.PremiumFeature_Icon} />,
    label: 'Meal planner max days',
    base: '7',
    premium: '∞',
  },
  {
    icon: <MaterialIcons name="shopping-basket" size={14} style={styles.PremiumFeature_Icon} />,
    label: 'Autobasket size',
    base: '5',
    premium: '∞',
  },
  {
    icon: <Entypo name="infinity" size={14} style={styles.PremiumFeature_Icon} />,
    label: 'Secure future premium features for the same price',
    base: '–',
    premium: '✓',
  },
];


const Feature = ({ icon, text, type = 'material' }) => (
  <View style={styles.feature}>
    {type === 'material'
      ? <MaterialIcons name={icon} size={16} color={addButtonColor} />
      : <Entypo name={icon} size={16} color={addButtonColor} />}
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const Plan = ({ title, price, detail, selected, onPress }) => (
  <Pressable onPress={onPress} style={[styles.plan, selected && styles.planHighlight]}>
    {selected && <Text style={styles.badge}>SELECTED</Text>}
    <Text style={styles.planTitle}>{title}</Text>
    <Text style={styles.planPrice}>{price}</Text>
    <Text style={styles.planDetail}>{detail}</Text>
  </Pressable>
);


const [selectedPlan, setSelectedPlan] = useState('yearly');

  const handlePurchase = () => {
    console.log('Purchasing plan:', selectedPlan);
  };


  return (
    <View style={styles.UserSettingsPage}>
      {/* <ScrollView > */}
        <View style={styles.UserSettingsPage_ContentWrapper}>

          {/* Title */}
          <Text style={styles.title}>Unlock all Plus features</Text>
          <Text style={styles.subtitle}>Use the app's full potential</Text>

          {/* Feature list */}
          {/* <View style={styles.features}>
            <Feature icon="group" text="Unlock family account for up to 5 users" />
            <Feature icon="photo-camera" text="Upload your own pictures" />
            <Feature type="entypo" icon="calendar" text="Unlimited dates for Meal Planner" />
            <Feature icon="shopping-basket" text="Unlimited Autobasket size" />
            <Feature type="entypo" icon="infinity" text="Access to future premium features for the same price" />
          </View> */}

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
              <Text style={styles.PremiumFeature_Text}>Access to the future premium features for the same price</Text>
            </View>

          </View>   

          {/* Plans */}
          <View style={styles.plans}>
            <Plan
              title="Yearly"
              price="-"
              detail="Billed never yet"
              selected={selectedPlan === 'yearly'}
              onPress={() => setSelectedPlan('yearly')}
            />
            <Plan
              title="Monthly"
              price="€3.99"
              detail="Billed monthly"
              selected={selectedPlan === 'monthly'}
              onPress={() => setSelectedPlan('monthly')}
            />
          </View>

          {/* <View style={styles.listOfPremiumFeatures}>

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

          </View>    */}

          {/* <View style={styles.listOfPremiumFeatures}>

            <Text style={{fontFamily: ReceiptFont, fontSize: 20, marginTop: -20, marginBottom: 20}}>Why upgrading to premium?</Text>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeaderCell, styles.featureCol]}></Text>
              <Text style={styles.tableHeaderCell}>Base</Text>
              <Text style={styles.tableHeaderCell}>Premium</Text>
            </View>

            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.featureCol]}>
                  {feature.icon}
                  <Text style={styles.PremiumFeature_Text}>{feature.label}</Text>
                </View>
                <Text style={[styles.tableCell,]}>{feature.base}</Text>
                <Text style={[styles.tableCell, styles.featureIcon]}>{feature.premium}</Text>
              </View>
            ))}
          </View> */}

          
          {/* <Text style={styles.explanationHint}>* Why cannot these features be free? (i)</Text> */}
            {/* Include a short explanation here about the costs of running the app, e.g. server costs, development time, etc. */}


            {/* OR: MANAGE SUBSCRIPTION */}

          <Pressable style={styles.upgradeButton} onPress={handlePurchase}>
            <Text style={styles.upgradeText}>Get Freedgy Plus</Text>
          </Pressable>

          <View style={styles.footer}>
            <TouchableOpacity><Text>Terms</Text></TouchableOpacity>
            <TouchableOpacity><Text>Privacy</Text></TouchableOpacity>
          </View>
          
        </View>
      {/* </ScrollView> */}

      
    </View>
  );
}

const styles = StyleSheet.create({
  UserSettingsPage: { 
    flex: 1, 
    backgroundColor: '#fff',
  },

  UserSettingsPage_ContentWrapper: { 
    padding: 20,
    paddingTop: height*0.1,
    height: height*0.8,
    // borderWidth: 1,
  },

  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginTop: 10 
  },

  subtitle: { 
    fontSize: 14, 
    color: '#555', 
    textAlign: 'center', 
    marginVertical: 10 
  },

  features: { 
    marginTop: 10 
  },

  feature: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },

  featureText: { 
    marginLeft: 8, 
    fontSize: 14, 
    color: '#333' 
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
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 2 
  },

  planDetail: { 
    fontSize: 12, 
    color: '#666' 
  },

  listOfPremiumFeatures: {
    marginTop: 10,
    padding: 10,
    // borderWidth: 1,
  },
  PremiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  PremiumFeature_Icon: {
    marginRight: 10,
    fontSize: 18,
    color: addButtonColor,
  },
  PremiumFeature_Text: {
    flexWrap: 'wrap',
    flexShrink: 1,
    fontFamily: MainFont,
    fontSize: TextFontSize,
    color: blackTextColor,
  },
  featureIcon: {
    fontSize: 16,
    fontFamily: MainFont_Bold,
    color: addButtonColor,
    // color: '#14db71'
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
    borderWidth: 1,
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center'
  },
  upgradeText: {
    fontSize: TextFontSize + 2,
    fontFamily: MainFont_SemiBold,
    color: 'white',
  },
  upgradeIcon: {
    color: 'white',
    marginHorizontal: 10,
    fontSize: TextFontSize + 4,
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

// const styles = StyleSheet.create({
//   UserSettingsPage: {
//     flex: 1,
//     backgroundColor: backgroundColor,
//     // alignItems: 'center',
//     // justifyContent: 'center'
//   },
//   UserSettingsPage_ContentWrapper: {
//     paddingHorizontal: 6,
//     // paddingVertical: 24,
//     height: height*0.6,
//     // alignItems: 'center',
//     justifyContent: 'center',
//     // borderWidth: 1,
//   },
//   sectionHeader: {
//     fontFamily: MainFont_Bold,
//     fontSize: 18,
//     marginBottom: 8,
//     color: '#222',
//   },
//   explanationHint: {
//     marginTop: 10,
//     fontSize: TextFontSize,
//     fontFamily: MainFont,
//     color: greyTextColor2,
//   },
//   upgradeButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: addButtonColor,
//     height: 42,
//     width: width*0.84,
//     borderRadius: 20,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     paddingHorizontal: 10,
//     position: 'absolute',
//     bottom: 30,
//     alignSelf: 'center'
//   },
//   upgradeText: {
//     fontSize: TextFontSize + 2,
//     fontFamily: MainFont_SemiBold,
//     color: 'white',
//   },
//   upgradeIcon: {
//     color: 'white',
//     marginHorizontal: 10,
//     fontSize: TextFontSize + 4,
//   },

//   listOfPremiumFeatures: {
//     marginTop: 10,
//     padding: 10,
//     // borderWidth: 1,
//   },
//   PremiumFeature: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 16,
//   },
//   PremiumFeature_Icon: {
//     marginRight: 10,
//     fontSize: 18,
//     color: addButtonColor,
//   },
//   PremiumFeature_Text: {
//     flexWrap: 'wrap',
//     flexShrink: 1,
//     fontFamily: MainFont_SemiBold,
//     fontSize: TextFontSize,
//     color: blackTextColor,
//   },
//   featureIcon: {
//     fontSize: 16,
//     fontFamily: MainFont_Bold,
//     color: addButtonColor,
//     // color: '#14db71'
//   },


// tableRow: {
//   flexDirection: 'row',
//   alignItems: 'center',
//   marginVertical: 12,
// },

// tableHeaderCell: {
//   fontFamily: MainFont_Bold,
//   fontSize: TextFontSize,
//   flex: 1,
//   textAlign: 'center',
// },

// tableCell: {
//   flex: 1,
//   textAlign: 'center',
// },

// featureCol: {
//   flex: 2,
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 4, // if using React Native 0.71+
// },

// });
