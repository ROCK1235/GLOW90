import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { WeightScreen } from '../features/weight/screens/WeightScreen';
import { LogWeightScreen } from '../features/weight/screens/LogWeightScreen';
import { NotificationSettingsScreen } from '../features/notifications/screens/NotificationSettingsScreen';
import { useAppDispatch } from '../store/hooks';
import { fetchHabits } from '../features/habits/habitsSlice';
import { fetchSupplements } from '../features/supplements/supplementsSlice';
import { getNotificationSettings } from '../lib/notificationSettings';
import { resyncScheduledNotifications } from '../lib/notifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Sits above MainTabs so Profile/Weight/NotificationSettings are reachable
// from any tab's header or dashboard card via navigate('X') — React
// Navigation bubbles the action up to this navigator when the target isn't
// found in the current (nested) one. Weight and NotificationSettings follow
// the same "no new bottom tab" pattern established for Profile.
export function RootStack() {
  const dispatch = useAppDispatch();

  // RootStack only mounts once authenticated, so this is effectively "once
  // per app session" — re-arm previously-enabled local reminders from
  // current habit/supplement data without requiring the user to reopen
  // Notification Settings every time they open the app.
  useEffect(() => {
    (async () => {
      const settings = await getNotificationSettings();
      if (!settings.enabled) return;
      const [habitsResult, supplementsResult] = await Promise.all([
        dispatch(fetchHabits()),
        dispatch(fetchSupplements()),
      ]);
      if (fetchHabits.fulfilled.match(habitsResult) && fetchSupplements.fulfilled.match(supplementsResult)) {
        await resyncScheduledNotifications({
          settings,
          habits: habitsResult.payload,
          supplements: supplementsResult.payload.items,
        });
      }
    })();
  }, [dispatch]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="LogWeight" component={LogWeightScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
