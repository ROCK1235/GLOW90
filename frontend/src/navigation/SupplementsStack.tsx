import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupplementsStackParamList } from './types';
import { SupplementsListScreen } from '../features/supplements/screens/SupplementsListScreen';
import { CreateSupplementScreen } from '../features/supplements/screens/CreateSupplementScreen';
import { EditSupplementScreen } from '../features/supplements/screens/EditSupplementScreen';

const Stack = createNativeStackNavigator<SupplementsStackParamList>();

export function SupplementsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SupplementsList" component={SupplementsListScreen} />
      <Stack.Screen name="CreateSupplement" component={CreateSupplementScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditSupplement" component={EditSupplementScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
