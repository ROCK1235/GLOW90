import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { HabitsStack } from './HabitsStack';
import { SupplementsStack } from './SupplementsStack';
import { SkincareStack } from './SkincareStack';
import { WaterScreen } from '../features/water/screens/WaterScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Water: 'water',
  Habits: 'checkmark-circle',
  Supplements: 'medical',
  Skincare: 'sparkles',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name as keyof MainTabParamList] : `${TAB_ICONS[route.name as keyof MainTabParamList]}-outline` as keyof typeof Ionicons.glyphMap}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Water" component={WaterScreen} />
      <Tab.Screen name="Habits" component={HabitsStack} />
      <Tab.Screen name="Supplements" component={SupplementsStack} />
      <Tab.Screen name="Skincare" component={SkincareStack} />
    </Tab.Navigator>
  );
}
