import React from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch, Platform, Linking } from 'react-native';
import { Card, Title, Paragraph, TextInput, Button, Text, Divider, List, Switch as PaperSwitch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { ENV_CONFIG } from '../../config/env';
import { useTheme } from '../ThemeProvider';
import LinkHandlingPrompt from '../LinkHandlingPrompt';

interface SettingsScreenProps {
  navigation: any;
  isFirstRun?: boolean;
  onFirstRunComplete?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  // For now, we'll use a simpler approach - check if we're in first run mode
  // by looking at the navigation state
  const isFirstRun = navigation.getState().routes.some((route: any) => route.name === 'FirstRunSettings');
  const onFirstRunComplete = () => {
    // Navigate to main app
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };
  const { isDarkMode, toggleDarkMode, theme } = useTheme();
  const [baseUrl, setBaseUrl] = React.useState('');
  const [apiToken, setApiToken] = React.useState('');
  const [workspace, setWorkspace] = React.useState(ENV_CONFIG.DEFAULT_WORKSPACE);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [biometricAuth, setBiometricAuth] = React.useState(false);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);
  const [showLinkHandlingPrompt, setShowLinkHandlingPrompt] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
    checkLinkHandlingPrompt();
  }, []);

  const checkLinkHandlingPrompt = async () => {
    try {
      // Check if we've shown the prompt before
      const hasShown = await AsyncStorage.getItem('link_handling_prompt_shown');
      // Check if API is configured (first run is complete)
      const hasConfigured = await SecureStore.getItemAsync('dagster_api_url');
      
      // Show prompt if:
      // 1. We haven't shown it before
      // 2. API is configured (first run complete)
      // 3. Not currently in first run mode
      if (!hasShown && hasConfigured && !isFirstRun) {
        // Small delay to let the screen render first
        setTimeout(() => {
          setShowLinkHandlingPrompt(true);
        }, 1000);
      }
    } catch (error) {
      console.warn('Error checking link handling prompt:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.warn('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  // Function to construct the full GraphQL URL from base URL and workspace
  const constructGraphQLUrl = (base: string, ws: string) => {
    if (!base || !ws) return '';
    
    // Clean the base URL and ensure it has a protocol
    let cleanBase = base.trim();
    let cleanWorkspace = ws.trim();
    
    // Add https:// if no protocol is specified
    if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
      cleanBase = `https://${cleanBase}`;
    }
    
    // Remove any trailing slashes
    cleanBase = cleanBase.replace(/\/$/, '');
    
    return `${cleanBase}/${cleanWorkspace}/graphql`;
  };

  const loadSettings = async () => {
    try {
      const savedApiUrl = await AsyncStorage.getItem('dagster_api_url');
      // Try SecureStore first, fallback to AsyncStorage for migration
      let savedApiToken = await SecureStore.getItemAsync('dagster_api_token');
      if (!savedApiToken) {
        savedApiToken = await AsyncStorage.getItem('dagster_api_token');
        // Migrate to SecureStore if found
        if (savedApiToken) {
          await SecureStore.setItemAsync('dagster_api_token', savedApiToken);
          await AsyncStorage.removeItem('dagster_api_token');
        }
      }
      const savedWorkspace = await AsyncStorage.getItem('dagster_workspace');
      const savedAutoRefresh = await AsyncStorage.getItem('dagster_auto_refresh');
      const savedNotifications = await AsyncStorage.getItem('dagster_notifications');
      const savedBiometricAuth = await AsyncStorage.getItem('biometric_auth_enabled');

      if (savedApiUrl) {
        // Extract base URL from saved full URL
        const fullUrl = savedApiUrl;
        const workspaceMatch = fullUrl.match(/\/([^\/]+)\/graphql$/);
        if (workspaceMatch) {
          const workspace = workspaceMatch[1];
          const baseUrl = fullUrl.replace(`/${workspace}/graphql`, '');
          setBaseUrl(baseUrl);
          setWorkspace(workspace);
        } else {
          setBaseUrl(savedApiUrl);
        }
      }
      if (savedApiToken) setApiToken(savedApiToken);
      if (savedWorkspace) setWorkspace(savedWorkspace);
      if (savedAutoRefresh !== null) setAutoRefresh(savedAutoRefresh === 'true');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
      if (savedBiometricAuth !== null) setBiometricAuth(savedBiometricAuth === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const fullGraphQLUrl = constructGraphQLUrl(baseUrl, workspace);
      await AsyncStorage.setItem('dagster_api_url', fullGraphQLUrl);
      // Store API token in SecureStore for better security
      await SecureStore.setItemAsync('dagster_api_token', apiToken);
      // Remove from AsyncStorage if it exists there
      await AsyncStorage.removeItem('dagster_api_token');
      await AsyncStorage.setItem('dagster_workspace', workspace);
      await AsyncStorage.setItem('dagster_auto_refresh', autoRefresh.toString());
      await AsyncStorage.setItem('dagster_notifications', notifications.toString());
      await AsyncStorage.setItem('biometric_auth_enabled', biometricAuth.toString());

      // Update Apollo client with new settings
      const { updateApolloClientWithSettings } = await import('../../lib/apollo-client');
      await updateApolloClientWithSettings();
      
      // Check if we should show link handling prompt after saving settings
      // (This happens after first run setup is complete)
      if (isFirstRun) {
        // Small delay to let the save complete
        setTimeout(() => {
          checkLinkHandlingPrompt();
        }, 500);
      }

      // Test the connection with a more robust query
      try {
        const { apolloClient } = await import('../../lib/apollo-client');
        const { GET_RUNS } = await import('../../lib/graphql/queries');
        
        // Test with a real query that requires authentication
        const result = await apolloClient.query({ 
          query: GET_RUNS,
          variables: { limit: 1 },
          errorPolicy: 'all'
        });
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(result.errors[0].message);
        }
        
        console.log('Connection test successful:', result);
      } catch (error) {
        console.warn('Connection test failed:', error);
        // Don't show warning alert - just log it and let user test manually
      }

      if (isFirstRun) {
        // Navigate to main app immediately after first run setup
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        Alert.alert('Success', 'Settings saved successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Main') }
        ]);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const testConnection = async () => {
    try {
      const fullGraphQLUrl = constructGraphQLUrl(baseUrl, workspace);
      console.log('Testing connection to:', fullGraphQLUrl);
      
      // Create a temporary Apollo client for testing
      const { ApolloClient, InMemoryCache, createHttpLink, from } = await import('@apollo/client');
      const { setContext } = await import('@apollo/client/link/context');
      
      const httpLink = createHttpLink({
        uri: fullGraphQLUrl,
        fetchOptions: {
          timeout: 10000, // 10 second timeout
        },
      });
      
      const authLink = setContext(async (_, { headers }) => {
        return {
          headers: {
            ...headers,
            authorization: apiToken ? `Bearer ${apiToken}` : '',
          }
        };
      });
      
      const testClient = new ApolloClient({
        link: from([authLink, httpLink]),
        cache: new InMemoryCache(),
      });
      
      // Test with a real query that requires authentication
      const { GET_RUNS } = await import('../../lib/graphql/queries');
      const result = await testClient.query({ 
        query: GET_RUNS,
        variables: { limit: 1 },
        errorPolicy: 'all'
      });
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }
      
      Alert.alert('Success', 'Connection test successful! Your settings are working correctly.');
    } catch (error) {
      console.error('Connection test failed:', error);
      let errorMessage = 'Connection test failed';
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please check your API token.';
        } else if (error.message.includes('404') || error.message.includes('Not Found')) {
          errorMessage = 'URL not found. Please check your Dagster instance URL.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request. Please check your URL and API token.';
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection and URL.';
        } else {
          errorMessage = `Connection failed: ${error.message}`;
        }
      }
      
      Alert.alert('Connection Test Failed', errorMessage);
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setBaseUrl('');
            setApiToken('');
            setWorkspace(ENV_CONFIG.DEFAULT_WORKSPACE);
            setAutoRefresh(true);
            setNotifications(true);
            setBiometricAuth(false);
            saveSettings();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {showLinkHandlingPrompt && (
        <LinkHandlingPrompt onDismiss={() => setShowLinkHandlingPrompt(false)} />
      )}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {isFirstRun && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Welcome to Dagster+ Mobile!</Title>
              <Paragraph style={styles.welcomeText}>
                To get started, please configure your Dagster instance details below.
                You'll need your Dagster URL and API token.
              </Paragraph>
              <Button 
                mode="outlined" 
                onPress={() => navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                })}
                style={styles.skipButton}
              >
                Skip Setup (Configure Later)
              </Button>
            </Card.Content>
          </Card>
        )}
        
        <Card style={styles.card}>
        <Card.Content>
          <Title>API Configuration</Title>
          <TextInput
            label="Dagster+ Base URL"
            value={baseUrl}
            onChangeText={(text) => setBaseUrl(text.trim())}
            mode="outlined"
            style={styles.input}
            placeholder="hooli.dagster.cloud"
          />
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            Full URL will be: {constructGraphQLUrl(baseUrl, workspace)}
          </Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            Tip: You can enter just the domain (e.g., "hooli.dagster.cloud") or include https://
          </Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            After saving, use "Test Connection" to verify your settings work correctly.
          </Text>
          <TextInput
            label="API Token"
            value={apiToken}
            onChangeText={(text) => setApiToken(text.trim())}
            mode="outlined"
            style={styles.input}
            secureTextEntry
            placeholder="Your API token"
          />
          <TextInput
            label="Default Workspace"
            value={workspace}
            onChangeText={(text) => setWorkspace(text.trim())}
            mode="outlined"
            style={styles.input}
            placeholder="prod"
          />
          <Button mode="contained" onPress={testConnection} style={styles.button}>
            Test Connection
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>App Preferences</Title>
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Auto-refresh data</Text>
            <Switch 
              value={autoRefresh} 
              onValueChange={setAutoRefresh}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={autoRefresh ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Enable notifications</Text>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.settingItem}>
            <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>Dark mode</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: '#4F43DD' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          {biometricAvailable && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.settingItem}>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: theme.colors.onSurface }]}>
                    Biometric authentication
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                    Use Face ID, Touch ID, or fingerprint to unlock the app
                  </Text>
                </View>
                <Switch 
                  value={biometricAuth} 
                  onValueChange={async (value) => {
                    if (value) {
                      // Test biometric before enabling
                      try {
                        const result = await LocalAuthentication.authenticateAsync({
                          promptMessage: 'Enable biometric authentication',
                          cancelLabel: 'Cancel',
                        });
                        if (result.success) {
                          setBiometricAuth(true);
                        }
                      } catch (error) {
                        Alert.alert('Error', 'Failed to authenticate. Please try again.');
                      }
                    } else {
                      setBiometricAuth(false);
                    }
                  }}
                  trackColor={{ false: '#767577', true: '#4F43DD' }}
                  thumbColor={biometricAuth ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {Platform.OS === 'android' && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Link Handling</Title>
            <Paragraph style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant, marginBottom: 16 }]}>
              Configure your device to open Dagster+ links directly in this app. When enabled, clicking Dagster+ links in email, Slack, or other apps will open in Dagster+ Mobile.
            </Paragraph>
            <Button
              mode="contained"
              onPress={async () => {
                try {
                  // Open Android app settings where user can set default apps
                  await Linking.openSettings();
                  
                  Alert.alert(
                    'Configure Link Handling',
                    'In the settings screen:\n\n1. Tap "Open by default" or "Set as default"\n2. Tap "Add link" or "Supported links"\n3. Enable "dagster.cloud" links\n4. Optionally, clear Chrome\'s defaults for these links\n\nAfter configuring, Dagster+ links will open in this app!',
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  Alert.alert(
                    'Error',
                    'Could not open settings. Please manually go to:\n\nSettings → Apps → Dagster+ Mobile → Open by default',
                    [{ text: 'OK' }]
                  );
                }
              }}
              style={styles.button}
              icon="link"
            >
              Configure Link Handling
            </Button>
            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
              Note: This only affects dagster.cloud links. Other websites will continue to open in your browser.
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>
          <Text style={styles.aboutText}>Dagster+ Mobile v{ENV_CONFIG.VERSION}</Text>
          <Text style={styles.aboutText}>
            A mobile-optimized interface for monitoring your Dagster+ environment
          </Text>
        </Card.Content>
      </Card>

        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={saveSettings} style={styles.saveButton}>
            Save Settings
          </Button>
          <Button mode="outlined" onPress={resetSettings} style={styles.resetButton}>
            Reset to Default
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  input: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    marginVertical: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  skipButton: {
    marginTop: 8,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  saveButton: {
    marginBottom: 8,
  },
  resetButton: {
    marginBottom: 16,
  },
});

export default SettingsScreen; 