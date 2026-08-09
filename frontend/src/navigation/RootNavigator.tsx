import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector } from '../store/hooks';
import { AuthStack } from './AuthStack';
import { RootStack } from './RootStack';
import { colors } from '../theme/colors';

export function RootNavigator() {
  const { status, hasBootstrapped } = useAppSelector((state) => state.auth);

  if (!hasBootstrapped) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <NavigationContainer>{status === 'authenticated' ? <RootStack /> : <AuthStack />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
