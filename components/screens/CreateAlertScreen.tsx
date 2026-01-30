import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeProvider';
import { AlertRule, AlertType } from '../../lib/types/alerts';
import { addAlert } from '../../lib/utils/alertStorage';
import { requestNotificationPermissions } from '../../lib/utils/notificationUtils';

interface CreateAlertScreenProps {
  navigation: any;
  route: any;
}

const CreateAlertScreen: React.FC<CreateAlertScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [name, setName] = React.useState('');
  const [alertType, setAlertType] = React.useState<AlertType>('JOB_FAILURE');
  const [saving, setSaving] = React.useState(false);

  // Pre-fill from route params if navigated from detail screen
  const { targetId, targetName, suggestedType } = route.params || {};

  React.useEffect(() => {
    if (suggestedType) {
      setAlertType(suggestedType);
    }
    if (targetName && !name) {
      // Auto-generate name based on type and target
      const typeName = getAlertTypeLabel(suggestedType || 'JOB_FAILURE');
      setName(`${typeName}: ${targetName}`);
    }
  }, [targetName, suggestedType]);

  const getAlertTypeLabel = (type: string): string => {
    switch (type) {
      case 'JOB_FAILURE':
        return 'Job Failure';
      case 'JOB_SUCCESS':
        return 'Job Success';
      case 'ASSET_FAILURE':
        return 'Asset Failure';
      case 'ASSET_SUCCESS':
        return 'Asset Success';
      case 'ANY_JOB_FAILURE':
        return 'Any Job Failure';
      case 'ASSET_CHECK_ERROR':
        return 'Asset Check Error';
      default:
        return type;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the alert');
      return;
    }

    // Check if alert type requires a target
    const requiresTarget = alertType !== 'ANY_JOB_FAILURE';
    if (requiresTarget && !targetId) {
      Alert.alert('Error', 'Please select a target for this alert type');
      return;
    }

    setSaving(true);

    try {
      // Request notification permissions
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissions Required',
          'Notification permissions are required for alerts to work. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
        setSaving(false);
        return;
      }

      const newAlert: AlertRule = {
        id: `alert_${Date.now()}_${Math.random()}`,
        name: name.trim(),
        type: alertType,
        targetId: targetId || undefined,
        targetName: targetName || undefined,
        enabled: true,
        createdAt: Date.now(),
      };

      await addAlert(newAlert);

      Alert.alert('Success', 'Alert created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating alert:', error);
      Alert.alert('Error', 'Failed to create alert');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              Alert Name
            </Text>
            <TextInput
              mode="outlined"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Production ETL Failure"
              style={styles.input}
            />

            <Text style={[styles.label, { color: theme.colors.onSurface, marginTop: 16 }]}>
              Alert Type
            </Text>
            <View style={styles.typeButtons}>
              <Button
                mode={alertType === 'JOB_FAILURE' ? 'contained' : 'outlined'}
                onPress={() => setAlertType('JOB_FAILURE')}
                style={styles.typeButton}
              >
                Job Failure
              </Button>
              <Button
                mode={alertType === 'JOB_SUCCESS' ? 'contained' : 'outlined'}
                onPress={() => setAlertType('JOB_SUCCESS')}
                style={styles.typeButton}
              >
                Job Success
              </Button>
              <Button
                mode={alertType === 'ANY_JOB_FAILURE' ? 'contained' : 'outlined'}
                onPress={() => setAlertType('ANY_JOB_FAILURE')}
                style={styles.typeButton}
              >
                Any Job Failure
              </Button>
              <Button
                mode={alertType === 'ASSET_FAILURE' ? 'contained' : 'outlined'}
                onPress={() => setAlertType('ASSET_FAILURE')}
                style={styles.typeButton}
              >
                Asset Failure
              </Button>
            </View>

            {targetName && (
              <View style={styles.targetSection}>
                <Text style={[styles.label, { color: theme.colors.onSurface }]}>
                  Target
                </Text>
                <Chip mode="flat" style={styles.targetChip}>
                  {targetName}
                </Chip>
              </View>
            )}

            {!targetId && alertType !== 'ANY_JOB_FAILURE' && (
              <Text style={[styles.helperText, { color: theme.colors.error }]}>
                Navigate to a specific job or asset to create an alert for it
              </Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            loading={saving}
            disabled={saving}
          >
            Create Alert
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    marginBottom: 8,
  },
  targetSection: {
    marginTop: 16,
  },
  targetChip: {
    alignSelf: 'flex-start',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default CreateAlertScreen;
