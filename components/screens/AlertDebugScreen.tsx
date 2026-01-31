import React from 'react';
import { View, ScrollView, StyleSheet, Alert as RNAlert } from 'react-native';
import { Card, Title, Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../ThemeProvider';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { loadAlerts, loadLastCheckTime } from '../../lib/utils/alertStorage';
import { getApolloClient } from '../../lib/apollo-client';
import { GET_RUNS } from '../../lib/graphql/queries';
import { triggerManualFetch } from '../../lib/utils/backgroundAlerts';

const AlertDebugScreen: React.FC = () => {
  const { theme } = useTheme();
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info: any = {
      timestamp: new Date().toISOString(),
    };

    try {
      // Check background task status
      const bgStatus = await BackgroundTask.getStatusAsync();
      const statusText = {
        [BackgroundTask.BackgroundTaskStatus.Restricted]: 'Restricted',
        [BackgroundTask.BackgroundTaskStatus.Denied]: 'Denied',
        [BackgroundTask.BackgroundTaskStatus.Available]: 'Available',
      };
      info.backgroundTaskStatus = statusText[bgStatus] || 'Unknown';

      // Check if task is registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync('DAGSTER_ALERTS_BACKGROUND_TASK');
      info.taskRegistered = isRegistered;

      // Get alerts
      const alerts = await loadAlerts();
      info.totalAlerts = alerts.length;
      info.enabledAlerts = alerts.filter(a => a.enabled).length;
      info.alerts = alerts.map(a => ({
        name: a.name,
        type: a.type,
        enabled: a.enabled,
        targetId: a.targetId,
        lastChecked: a.lastChecked ? new Date(a.lastChecked).toISOString() : 'Never',
        lastTriggered: a.lastTriggered ? new Date(a.lastTriggered).toISOString() : 'Never',
      }));

      // Get last check time
      const lastCheckTime = await loadLastCheckTime();
      info.lastCheckTime = new Date(lastCheckTime).toISOString();
      info.timeSinceLastCheck = `${Math.floor((Date.now() - lastCheckTime) / 1000 / 60)} minutes ago`;

      // Test Apollo client
      const apolloClient = getApolloClient();
      info.apolloClientAvailable = !!apolloClient;

      if (apolloClient) {
        // Fetch recent runs
        try {
          const { data } = await apolloClient.query({
            query: GET_RUNS,
            variables: { limit: 10 },
            fetchPolicy: 'network-only',
          });

          if (data?.runsOrError?.results) {
            const runs = data.runsOrError.results;
            info.recentRunsCount = runs.length;
            info.recentRuns = runs.slice(0, 5).map((run: any) => ({
              pipelineName: run.pipelineName,
              status: run.status,
              startTime: run.startTime,
              startTimeDate: run.startTime ? new Date(parseFloat(run.startTime) * 1000).toISOString() : 'N/A',
              runId: run.runId,
              isRecent: run.startTime ? parseFloat(run.startTime) >= lastCheckTime / 1000 : false,
            }));

            // Check for recent failures
            const recentFailures = runs.filter((run: any) => {
              const isFailure = run.status === 'FAILURE';
              const isRecent = run.startTime ? parseFloat(run.startTime) >= lastCheckTime / 1000 : false;
              return isFailure && isRecent;
            });
            info.recentFailuresCount = recentFailures.length;
          } else {
            info.runsError = 'No runs data returned';
          }
        } catch (error: any) {
          info.runsError = error.message;
        }
      }

      setDebugInfo(info);
    } catch (error: any) {
      info.error = error.message;
      setDebugInfo(info);
    } finally {
      setLoading(false);
    }
  };

  const testManualFetch = async () => {
    setLoading(true);
    try {
      const result = await triggerManualFetch(true);
      RNAlert.alert(
        'Manual Fetch Result',
        `Triggered: ${result.triggered}\nErrors: ${result.errors.length}`,
        [{ text: 'OK' }]
      );
      await runDiagnostics(); // Refresh diagnostics
    } catch (error: any) {
      RNAlert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Alert System Diagnostics</Title>
            <Button
              mode="contained"
              onPress={runDiagnostics}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Refresh Diagnostics
            </Button>
            <Button
              mode="outlined"
              onPress={testManualFetch}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Test Manual Fetch
            </Button>
          </Card.Content>
        </Card>

        {debugInfo && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.json}>{JSON.stringify(debugInfo, null, 2)}</Text>
            </Card.Content>
          </Card>
        )}
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
  card: {
    margin: 16,
    elevation: 2,
  },
  button: {
    marginTop: 12,
  },
  json: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default AlertDebugScreen;
