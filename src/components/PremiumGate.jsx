import React from 'react';
import { View } from 'react-native';
import { usePremiumStore } from '../store/premiumStore'; // adjust path

export default function PremiumGate({ children, fallback = null }) {
  const isPremium = usePremiumStore(s => s.isPremium);
  return <View>{isPremium ? children : fallback}</View>;
}