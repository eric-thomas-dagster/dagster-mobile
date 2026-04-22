import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Share, Alert } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Divider, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@apollo/client';
import { GET_RUN, GET_RUN_LOGS, TERMINATE_RUN, LAUNCH_RUN_REEXECUTION } from '../../lib/graphql/queries';
import { useToast } from '../ToastProvider';
import LogsViewer from '../LogsViewer';
import { formatDagsterDate, formatDagsterTime, formatDagsterDateTime } from '../../lib/utils/dateUtils';
import { mockLogs, mockFailedLogs } from '../../lib/mock-data';
import { useTheme } from '../ThemeProvider';
import { generateDagsterUrl } from '../../lib/utils/shareUtils';
import { CompassPromptPills } from '../compass/CompassPromptPills';

interface RunDetailScreenProps {
  navigation: any;
  route: any;
}

const RunDetailScreen: React.FC<RunDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showLogs, setShowLogs] = React.useState(false);
  const { runId } = route.params;

  const { data, loading, refetch, error } = useQuery(GET_RUN, {
    variables: { runId },
    errorPolicy: 'all',
  });

  const { showToast } = useToast();
  const [terminateRun, { loading: terminating }] = useMutation(TERMINATE_RUN);
  const [reexecuteRun, { loading: reexecuting }] = useMutation(LAUNCH_RUN_REEXECUTION);

  const handleTerminate = () => {
    Alert.alert(
      'Terminate run?',
      'This will stop the run. In-flight steps will attempt to clean up.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await terminateRun({
                variables: { runId, terminatePolicy: 'SAFE_TERMINATE' },
              });
              const result = res.data?.terminatePipelineExecution;
              if (result?.__typename === 'TerminateRunSuccess') {
                showToast('Run termination requested');
                refetch();
              } else {
                showToast(result?.message || 'Could not terminate run');
              }
            } catch (e: any) {
              showToast(e?.message || 'Failed to terminate run');
            }
          },
        },
      ],
    );
  };

  const handleReexecute = (strategy: 'ALL_STEPS' | 'FROM_FAILURE') => {
    const title = strategy === 'FROM_FAILURE' ? 'Retry from failure?' : 'Re-run from start?';
    const body =
      strategy === 'FROM_FAILURE'
        ? 'Launches a new run that resumes from the failed step.'
        : 'Launches a new run that repeats the entire pipeline.';
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Launch',
        onPress: async () => {
          try {
            const res = await reexecuteRun({
              variables: { reexecutionParams: { parentRunId: runId, strategy } },
            });
            const result = res.data?.launchPipelineReexecution;
            if (result?.__typename === 'LaunchRunSuccess') {
              const newRunId = result.run?.runId;
              showToast('New run launched');
              if (newRunId) {
                navigation.navigate('RunDetail', { runId: newRunId });
              }
            } else {
              const msg =
                result?.message || result?.errors?.[0]?.message || 'Could not launch re-execution';
              showToast(msg);
            }
          } catch (e: any) {
            showToast(e?.message || 'Failed to launch re-execution');
          }
        },
      },
    ]);
  };

  // Debug logging
  React.useEffect(() => {
    console.log('RunDetailScreen - runId:', runId);
    console.log('RunDetailScreen - data:', data);
    console.log('RunDetailScreen - error:', error);
    if (data?.runOrError) {
      console.log('RunDetailScreen - runOrError:', data.runOrError);
    }
  }, [runId, data, error]);

  // Set up header with status chip, alert button, and share button
  React.useEffect(() => {
    if (data?.runOrError) {
      const run = data.runOrError;
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <View style={[styles.headerStatusPill, { backgroundColor: getStatusColor(run.status) }]}>
              <Text style={styles.headerStatusText}>{run.status}</Text>
            </View>
            <IconButton
              icon="share-variant"
              size={20}
              onPress={async () => {
                try {
                  const url = await generateDagsterUrl(
                    'run',
                    runId,
                    run.repositoryOrigin?.repositoryLocationName,
                    run.repositoryOrigin?.repositoryName
                  );
                  if (url) {
                    await Share.share({
                      message: url,
                      url: url, // iOS
                      title: 'Share Run', // Android
                    });
                  } else {
                    Alert.alert('Error', 'Could not generate share URL. Please check your settings.');
                  }
                } catch (error: any) {
                  Alert.alert('Error', `Failed to share: ${error.message}`);
                }
              }}
              style={{ margin: 0 }}
            />
          </View>
        ),
      });
    }
  }, [navigation, data, runId]);

  const { 
    data: logsData, 
    loading: logsLoading, 
    refetch: refetchLogs,
    error: logsError
  } = useQuery(GET_RUN_LOGS, {
    variables: { runId },
    skip: !showLogs, // Only fetch logs when logs are shown
  });

  // Debug logging
  React.useEffect(() => {
    if (showLogs) {
      console.log('Logs query executed for runId:', runId);
      console.log('Logs data:', logsData);
      console.log('Logs error:', logsError);
      if (logsData?.logsForRun?.__typename === 'EventConnection') {
        console.log('Logs events:', logsData.logsForRun.events);
        console.log('Number of events:', logsData.logsForRun.events?.length);
      }
    }
  }, [showLogs, logsData, logsError, runId]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), showLogs ? refetchLogs() : Promise.resolve()]);
    setRefreshing(false);
  }, [refetch, refetchLogs, showLogs]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'RUNNING':
        return '#2196f3';
      case 'CANCELED':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDagsterDate(dateString);
  };

  const formatTime = (dateString: string) => {
    return formatDagsterTime(dateString);
  };

  const handlePipelinePress = () => {
    // Navigate to Jobs tab and then to Job Details
    navigation.navigate('Jobs', {
      screen: 'JobDetail',
      params: { jobId: run.id }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading run details...</Text>
      </SafeAreaView>
    );
  }

  const run = data?.runOrError;
  
  if (error) {
    console.log('RunDetailScreen - GraphQL error:', error);
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Error loading run: {error.message}</Text>
      </SafeAreaView>
    );
  }
  
  if (!run) {
    console.log('RunDetailScreen - No run data found');
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Run not found</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Run ID: {runId}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.runHeader}>
              <Title>{run.pipelineName}</Title>
            </View>
            <Text style={styles.runId}>Run ID: {run.runId}</Text>
            {run.startTime && (
              <Text style={styles.runTime}>
                Started: {formatDate(run.startTime)} at {formatTime(run.startTime)}
              </Text>
            )}
            {run.endTime && (
              <Text style={styles.runTime}>
                Ended: {formatDate(run.endTime)} at {formatTime(run.endTime)}
              </Text>
            )}

            {/* Interventions — only show buttons that make sense for the current status */}
            <View style={styles.interventionRow}>
              {(run.status === 'STARTED' ||
                run.status === 'STARTING' ||
                run.status === 'QUEUED') && (
                <Button
                  mode="outlined"
                  onPress={handleTerminate}
                  loading={terminating}
                  disabled={terminating}
                  icon="stop"
                  textColor="#f44336"
                  style={[styles.interventionBtn, { borderColor: '#f44336' }]}
                  compact
                >
                  Terminate
                </Button>
              )}
              {(run.status === 'FAILURE' || run.status === 'CANCELED') && (
                <Button
                  mode="contained"
                  onPress={() => handleReexecute('FROM_FAILURE')}
                  loading={reexecuting}
                  disabled={reexecuting}
                  icon="replay"
                  style={styles.interventionBtn}
                  compact
                >
                  Retry from failure
                </Button>
              )}
              {(run.status === 'SUCCESS' ||
                run.status === 'FAILURE' ||
                run.status === 'CANCELED') && (
                <Button
                  mode="outlined"
                  onPress={() => handleReexecute('ALL_STEPS')}
                  loading={reexecuting}
                  disabled={reexecuting}
                  icon="restart"
                  style={styles.interventionBtn}
                  compact
                >
                  Re-run all
                </Button>
              )}
            </View>

            <CompassPromptPills
              prompts={[
                ...(run.status === 'FAILURE' || run.status === 'CANCELED'
                  ? [{
                      label: 'Why did this fail?',
                      prompt: `Run ${run.runId} of job "${run.pipelineName}" ended with status ${run.status}. Explain the root cause of the failure, which step failed, and how to fix it.`,
                    }]
                  : []),
                {
                  label: 'Summarize this run',
                  prompt: `Summarize what happened in run ${run.runId} of job "${run.pipelineName}". What was materialized, how long did it take, anything unusual?`,
                },
                {
                  label: 'Slowest steps',
                  prompt: `Which steps in run ${run.runId} of job "${run.pipelineName}" took the longest, and why?`,
                },
              ]}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Title>Pipeline</Title>
            <TouchableOpacity onPress={handlePipelinePress} activeOpacity={0.7}>
              <Text style={[styles.infoItem, styles.clickableText, { color: theme.colors.primary }]}>{run.pipelineName}</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {run.tags.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Tags</Title>
              {run.tags.map((tag: any, index: number) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagKey}>{tag.key}:</Text>
                  <Text style={styles.tagValue} numberOfLines={0}>{tag.value}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logsHeader}>
              <Title>Logs</Title>
              <Button
                mode={showLogs ? "contained" : "outlined"}
                onPress={() => setShowLogs(!showLogs)}
                style={styles.logsButton}
              >
                {showLogs ? "Hide Logs" : "Show Logs"}
              </Button>
            </View>
            {showLogs && (logsError || !logsData?.logsForRun || logsData?.logsForRun?.__typename !== 'EventConnection') && (
              <Text style={styles.mockNote}>
                Showing sample logs (API logs not available)
              </Text>
            )}
            {showLogs && (
              <View style={styles.logsContainer}>
                <LogsViewer
                  logs={
                    logsData?.logsForRun?.__typename === 'EventConnection' && logsData.logsForRun.events?.length > 0 
                      ? logsData.logsForRun.events 
                      : logsError || !logsData?.logsForRun || logsData?.logsForRun?.__typename !== 'EventConnection'
                        ? (run.status === 'FAILURE' ? mockFailedLogs : mockLogs)
                        : []
                  }
                  loading={logsLoading}
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  interventionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  interventionBtn: {
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  runId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  runTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagItem: {
    marginVertical: 8,
    paddingVertical: 4,
  },
  tagKey: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagValue: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    flexWrap: 'wrap',
  },
  stepItem: {
    marginVertical: 8,
  },
  stepName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepKind: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stepDeps: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  infoItem: {
    fontSize: 14,
    marginVertical: 2,
  },
  divider: {
    marginVertical: 16,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logsButton: {
    marginLeft: 8,
  },
  logsContainer: {
    flex: 1,
    minHeight: 400,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  headerStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  headerStatusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  clickableText: {
    textDecorationLine: 'underline',
  },
  mockNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
});

export default RunDetailScreen; 