import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert as RNAlert, Switch } from 'react-native';
import { Card, Title, Text, FAB, IconButton, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeProvider';
import { AlertRule } from '../../lib/types/alerts';
import { loadAlerts, deleteAlert, toggleAlert } from '../../lib/utils/alertStorage';
import { useFocusEffect } from '@react-navigation/native';

interface AlertsScreenProps {
  navigation: any;
}

const AlertsScreen: React.FC<AlertsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [alerts, setAlerts] = React.useState<AlertRule[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadAlertsData = async () => {
    const loadedAlerts = await loadAlerts();
    setAlerts(loadedAlerts);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAlertsData();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAlertsData();
    setRefreshing(false);
  }, []);

  const handleToggle = async (alertId: string) => {
    await toggleAlert(alertId);
    await loadAlertsData();
  };

  const handleDelete = async (alert: AlertRule) => {
    RNAlert.alert(
      'Delete Alert',
      `Are you sure you want to delete the alert "${alert.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAlert(alert.id);
            await loadAlertsData();
          },
        },
      ]
    );
  };

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
      case 'ANY_JOB_SUCCESS':
        return 'Any Job Success';
      case 'ASSET_CHECK_ERROR':
        return 'Asset Check Error';
      default:
        return type;
    }
  };

  const getAlertTypeColor = (type: string): string => {
    switch (type) {
      case 'JOB_FAILURE':
      case 'ASSET_FAILURE':
      case 'ANY_JOB_FAILURE':
      case 'ASSET_CHECK_ERROR':
        return '#f44336';
      case 'JOB_SUCCESS':
      case 'ASSET_SUCCESS':
      case 'ANY_JOB_SUCCESS':
        return '#4caf50';
      default:
        return theme.colors.primary;
    }
  };

  const renderAlert = ({ item }: { item: AlertRule }) => {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.alertHeader}>
            <View style={styles.alertInfo}>
              <Title style={[styles.alertName, { color: theme.colors.onSurface }]}>
                {item.name}
              </Title>
              <Chip
                mode="flat"
                style={[styles.typeChip, { backgroundColor: getAlertTypeColor(item.type) + '20' }]}
                textStyle={{ color: getAlertTypeColor(item.type), fontSize: 13, fontWeight: '500' }}
              >
                {getAlertTypeLabel(item.type)}
              </Chip>
            </View>
            <View style={styles.alertActions}>
              <Switch
                value={item.enabled}
                onValueChange={() => handleToggle(item.id)}
                trackColor={{ false: '#767577', true: '#4F43DD' }}
                thumbColor={item.enabled ? '#ffffff' : '#f4f3f4'}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDelete(item)}
              />
            </View>
          </View>

          {item.targetName && (
            <Text style={[styles.targetText, { color: theme.colors.onSurfaceVariant }]}>
              Target: {item.targetName}
            </Text>
          )}

          <View style={styles.alertFooter}>
            <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
              {item.enabled ? 'Active' : 'Disabled'}
            </Text>
            {item.lastTriggered && (
              <Text style={[styles.lastTriggeredText, { color: theme.colors.onSurfaceVariant }]}>
                Last triggered: {new Date(item.lastTriggered).toLocaleDateString()}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No alerts configured
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              Tap the + button to create your first alert
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#ffffff"
        onPress={() => navigation.navigate('CreateAlert')}
        label="Create Alert"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginRight: 8,
  },
  alertName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  typeChip: {
    alignSelf: 'flex-start',
    height: 32,
    paddingHorizontal: 12,
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetText: {
    fontSize: 14,
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
  },
  lastTriggeredText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default AlertsScreen;
