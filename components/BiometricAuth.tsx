import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from './ThemeProvider';

interface BiometricAuthProps {
  onAuthenticated: () => void;
  onCancel?: () => void;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ onAuthenticated, onCancel }) => {
  const { theme } = useTheme();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<string>('biometric');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailabilityAndAuthenticate();
  }, []);

  const checkBiometricAvailabilityAndAuthenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setError('Biometric authentication is not available on this device.');
        setIsAvailable(false);
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setError('No biometric authentication is enrolled. Please set up biometric authentication in your device settings.');
        setIsAvailable(false);
        return;
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock');
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint');
      } else {
        setBiometricType('biometric authentication');
      }

      setIsAvailable(true);

      // Trigger authentication immediately
      performAuthentication();
    } catch (err) {
      console.error('Error checking biometric availability:', err);
      setError('Unable to check biometric availability.');
      setIsAvailable(false);
    }
  };

  const performAuthentication = async () => {
    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Dagster+',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow device passcode as fallback
      });

      if (result.success) {
        onAuthenticated();
      } else {
        if (result.error === 'user_cancel') {
          if (onCancel) {
            onCancel();
          }
        } else {
          setError(`Authentication failed: ${result.error}`);
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticate = () => {
    // Wrapper function for retry button
    performAuthentication();
  };

  if (!isAvailable && error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Biometric Authentication Unavailable
            </Text>
            <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={onAuthenticated}
              style={styles.button}
            >
              Continue Without Biometric
            </Button>
            {onCancel && (
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.button}
              >
                Cancel
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  }

  // If authenticating, show minimal UI (native prompt is showing)
  if (isAuthenticating) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  // If authentication failed, show retry option
  if (error && isAvailable) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Authentication Failed
            </Text>
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={authenticate}
              style={styles.button}
            >
              Try Again
            </Button>
            {onCancel && (
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.button}
              >
                Cancel
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Loading state while checking availability
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
  },
  loader: {
    marginTop: 24,
  },
});

export default BiometricAuth;

