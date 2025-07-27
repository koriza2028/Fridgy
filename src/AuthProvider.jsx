import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from './store/authStore';

export default function AuthProvider({ children }) {
  const loading = useAuthStore(state => state.loading);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
