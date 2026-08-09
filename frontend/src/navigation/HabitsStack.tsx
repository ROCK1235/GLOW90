import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HabitsStackParamList } from './types';
import { HabitsListScreen } from '../features/habits/screens/HabitsListScreen';
import { CreateHabitScreen } from '../features/habits/screens/CreateHabitScreen';
import { EditHabitScreen } from '../features/habits/screens/EditHabitScreen';

const Stack = createNativeStackNavigator<HabitsStackParamList>();

export function HabitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HabitsList" component={HabitsListScreen} />
      <Stack.Screen name="CreateHabit" component={CreateHabitScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditHabit" component={EditHabitScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
