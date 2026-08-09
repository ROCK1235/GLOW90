import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/store/store';
import { useAppDispatch } from './src/store/hooks';
import { bootstrapAuth } from './src/features/auth/authSlice';
import { RootNavigator } from './src/navigation/RootNavigator';

function Bootstrapper() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  return <RootNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <Bootstrapper />
          <StatusBar style="auto" />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
