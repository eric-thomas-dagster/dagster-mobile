import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apolloClient, updateApolloClientWithSettings } from './lib/apollo-client';
import AppNavigator from './components/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import BiometricAuth from './components/BiometricAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerBackgroundFetch } from './lib/utils/backgroundAlerts';
import { requestNotificationPermissions } from './lib/utils/notificationUtils';

const AppContent = () => {
  const { theme } = useTheme();
  const [isFirstRun, setIsFirstRun] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);

  React.useEffect(() => {
    checkFirstRun();
    checkBiometricSetting();
    initializeAlerts();
  }, []);

  const initializeAlerts = async () => {
    try {
      // Request notification permissions
      await requestNotificationPermissions();
      // Register background fetch for alerts
      await registerBackgroundFetch();
      console.log('Alerts initialized successfully');
    } catch (error) {
      console.error('Error initializing alerts:', error);
    }
  };

  const checkBiometricSetting = async () => {
    try {
      const enabled = await AsyncStorage.getItem('biometric_auth_enabled');
      setBiometricEnabled(enabled === 'true');
      // If biometric is not enabled, auto-authenticate
      if (enabled !== 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.warn('Error checking biometric setting:', error);
      setIsAuthenticated(true); // Default to authenticated if check fails
    }
  };

  const checkFirstRun = async () => {
    try {
      const hasConfigured = await AsyncStorage.getItem('dagster_api_url');
      if (!hasConfigured) {
        setIsFirstRun(true);
      } else {
        // Load stored settings and update Apollo client
        await updateApolloClientWithSettings();
      }
    } catch (error) {
      console.warn('Error checking first run:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstRunComplete = async () => {
    try {
      // Load stored settings and update Apollo client
      await updateApolloClientWithSettings();
      setIsFirstRun(false);
    } catch (error) {
      console.warn('Error completing first run:', error);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleAuthCancel = () => {
    // If user cancels, still allow access (they can disable biometric in settings)
    setIsAuthenticated(true);
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  // Show biometric auth if enabled and not authenticated
  if (biometricEnabled && !isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          style={theme.dark ? 'light' : 'dark'} 
          backgroundColor="transparent"
          translucent={true}
        />
        <BiometricAuth 
          onAuthenticated={handleAuthenticated}
          onCancel={handleAuthCancel}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        style={theme.dark ? 'light' : 'dark'} 
        backgroundColor="transparent"
        translucent={true}
      />
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <AppNavigator isFirstRun={isFirstRun} onFirstRunComplete={handleFirstRunComplete} />
        </PaperProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
