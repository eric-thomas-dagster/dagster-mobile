/**
 * Component to handle shared URLs and provide "Open in App" functionality
 */

import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useTheme } from './ThemeProvider';
import { parseDagsterUrl, getNavigationParams } from '../lib/utils/deepLinkUtils';
import { isDagsterUrl } from '../lib/utils/shareUtils';

interface ShareUrlHandlerProps {
  onUrlHandled: (url: string) => void;
  onClose: () => void;
}

const ShareUrlHandler: React.FC<ShareUrlHandlerProps> = ({ onUrlHandled, onClose }) => {
  const { theme } = useTheme();
  const [clipboardUrl, setClipboardUrl] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    checkClipboard();
  }, []);

  const checkClipboard = async () => {
    setChecking(true);
    try {
      const text = await Clipboard.getStringAsync();
      if (text && isDagsterUrl(text)) {
        setClipboardUrl(text);
      } else {
        setClipboardUrl(null);
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleOpenUrl = (url: string) => {
    onUrlHandled(url);
    onClose();
  };

  const handlePasteUrl = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && isDagsterUrl(text)) {
        handleOpenUrl(text);
      } else {
        Alert.alert(
          'Invalid URL',
          'The clipboard does not contain a valid Dagster+ URL. Please copy a Dagster+ URL and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to read clipboard');
    }
  };

  if (checking) {
    return null;
  }

  if (!clipboardUrl) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Open Dagster+ URL
          </Text>
          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            Copy a Dagster+ URL to your clipboard, then tap "Paste & Open" to open it in the app.
          </Text>
          <Button
            mode="contained"
            onPress={handlePasteUrl}
            style={styles.button}
          >
            Paste & Open
          </Button>
          <Button
            mode="text"
            onPress={onClose}
            style={styles.closeButton}
          >
            Cancel
          </Button>
        </Card.Content>
      </Card>
    );
  }

  const parsed = parseDagsterUrl(clipboardUrl);
  let urlDescription = 'Dagster+ URL';
  if (parsed.valid) {
    switch (parsed.type) {
      case 'sensor':
        urlDescription = `Sensor: ${parsed.name}`;
        break;
      case 'schedule':
        urlDescription = `Schedule: ${parsed.name}`;
        break;
      case 'job':
        urlDescription = `Job: ${parsed.name}`;
        break;
      case 'asset':
        urlDescription = `Asset: ${parsed.path?.join('/') || 'Unknown'}`;
        break;
      case 'run':
        urlDescription = `Run: ${parsed.runId}`;
        break;
    }
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Open in App?
        </Text>
        <Text style={[styles.urlDescription, { color: theme.colors.onSurfaceVariant }]}>
          {urlDescription}
        </Text>
        <Text style={[styles.url, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {clipboardUrl}
        </Text>
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={() => handleOpenUrl(clipboardUrl)}
            style={styles.button}
          >
            Open
          </Button>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.button}
          >
            Cancel
          </Button>
        </View>
        <Button
          mode="text"
          onPress={checkClipboard}
          style={styles.refreshButton}
        >
          Check Clipboard Again
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 20,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  urlDescription: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  closeButton: {
    marginTop: 8,
  },
  refreshButton: {
    marginTop: 8,
  },
});

export default ShareUrlHandler;

