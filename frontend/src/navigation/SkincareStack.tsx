import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SkincareStackParamList } from './types';
import { SkincareListScreen } from '../features/skincare/screens/SkincareListScreen';
import { CreateSkincareRoutineScreen } from '../features/skincare/screens/CreateSkincareRoutineScreen';
import { EditSkincareRoutineScreen } from '../features/skincare/screens/EditSkincareRoutineScreen';

const Stack = createNativeStackNavigator<SkincareStackParamList>();

export function SkincareStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SkincareList" component={SkincareListScreen} />
      <Stack.Screen
        name="CreateSkincareRoutine"
        component={CreateSkincareRoutineScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="EditSkincareRoutine"
        component={EditSkincareRoutineScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
