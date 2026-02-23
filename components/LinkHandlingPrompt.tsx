import React from 'react';
import { View, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { useTheme } from './ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LinkHandlingPromptProps {
  onDismiss: () => void;
}

const LinkHandlingPrompt: React.FC<LinkHandlingPromptProps> = ({ onDismiss }) => {
  const { theme } = useTheme();

  const handleConfigure = async () => {
    if (Platform.OS === 'android') {
      try {
        // Open Android app settings
        await Linking.openSettings();
        
        Alert.alert(
          'Configure Link Handling',
          'In the settings screen:\n\n1. Tap "Open by default" or "Set as default"\n2. Tap "Add link" or "Supported links"\n3. Enable "dagster.cloud" links\n4. Optionally, clear Chrome\'s defaults for these links\n\nAfter configuring, Dagster+ links will open in this app!',
          [
            { 
              text: 'OK',
              onPress: () => {
                // Mark as shown
                AsyncStorage.setItem('link_handling_prompt_shown', 'true');
                onDismiss();
              }
            }
          ]
        );
      } catch (error) {
        Alert.alert(
          'Error',
          'Could not open settings. Please manually go to:\n\nSettings → Apps → Dagster+ Mobile → Open by default',
          [{ text: 'OK' }]
        );
      }
    } else {
      // iOS - explain that it requires domain verification
      Alert.alert(
        'iOS Universal Links',
        'For iOS, Dagster+ needs to add a verification file to their domain. Once that\'s done, links will open automatically in this app.\n\nUntil then, you can:\n• Copy Dagster+ links and use the "Share to App" feature\n• Use the custom URL scheme: dagster-mobile://',
        [
          { 
            text: 'OK',
            onPress: () => {
              AsyncStorage.setItem('link_handling_prompt_shown', 'true');
              onDismiss();
            }
          }
        ]
      );
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('link_handling_prompt_shown', 'true');
    onDismiss();
  };

  return (
    <View style={styles.overlay}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.title, { color: theme.colors.onSurface }]}>
            Enable Link Handling
          </Title>
          <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {Platform.OS === 'android' ? (
              'Configure your device to open Dagster+ links directly in this app. When enabled, clicking Dagster+ links in email, Slack, or other apps will open in Dagster+ Mobile.'
            ) : (
              'On iOS, Universal Links require domain verification files. Once Dagster+ adds these files, links will open automatically. Until then, use the "Share to App" feature.'
            )}
          </Paragraph>
          {Platform.OS === 'android' && (
            <Text style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
              Note: This only affects dagster.cloud links. Other websites will continue to open in your browser.
            </Text>
          )}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleConfigure}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              {Platform.OS === 'android' ? 'Configure Now' : 'Learn More'}
            </Button>
            <Button
              mode="text"
              onPress={handleSkip}
              style={styles.skipButton}
              labelStyle={[styles.skipButtonLabel, { color: theme.colors.onSurfaceVariant }]}
            >
              Maybe Later
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  skipButton: {
    marginTop: 4,
  },
  skipButtonLabel: {
    fontSize: 14,
  },
});

export default LinkHandlingPrompt;

