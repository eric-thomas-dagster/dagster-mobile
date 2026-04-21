import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatsSkeleton, CardSkeletonList } from '../SkeletonLoader';
import EmptyState from '../EmptyState';
import { useToast } from '../ToastProvider';
import { useQuery } from '@apollo/client';
import { GET_RUNS, GET_JOBS, GET_ASSETS, GET_INSIGHTS_ASSETS_SELECTION } from '../../lib/graphql/queries';
import { RepositorySelector, DagsterCloudDeployment } from '../../lib/types/dagster';
import { mockRuns, mockPipelines, mockAssets } from '../../lib/mock-data';
import DeploymentSelector from '../DeploymentSelector';
import { CompassHeaderButton } from '../compass/CompassHeaderButton';
import { CompassPromptPills } from '../compass/CompassPromptPills';
import { updateApolloClientUrl } from '../../lib/apollo-client';
import { formatDagsterDate, formatDagsterTime } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showDeploymentSelector, setShowDeploymentSelector] = React.useState(false);
  const [currentDeployment, setCurrentDeployment] = React.useState('data-eng-prod');
  const [hasConfiguredSettings, setHasConfiguredSettings] = React.useState(false);
  const [isCheckingSettings, setIsCheckingSettings] = React.useState(true);

  // Set up header with settings and deployment selector
  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
          {hasConfiguredSettings && (
            <Button
              mode="outlined"
              onPress={() => setShowDeploymentSelector(true)}
              compact
              style={{ marginRight: 4 }}
              contentStyle={{ paddingVertical: 0, height: 28 }}
              labelStyle={{ fontSize: 12, marginVertical: 4 }}
            >
              {currentDeployment}
            </Button>
          )}
          <CompassHeaderButton />
          <IconButton
            icon="cog"
            size={24}
            onPress={() => navigation.navigate('Settings')}
            style={{ margin: 0 }}
          />
        </View>
      ),
    });
  }, [navigation, hasConfiguredSettings, currentDeployment]);

  const { data: runsData, loading: runsLoading, refetch: refetchRuns, error: runsError } = useQuery(GET_RUNS, {
    variables: { limit: 5 },
    errorPolicy: 'all',
  });

  const { data: jobsData, loading: jobsLoading, refetch: refetchJobs, error: jobsError } = useQuery(GET_JOBS, {
    errorPolicy: 'all',
  });

  const { data: assetsData, loading: assetsLoading, refetch: refetchAssets, error: assetsError } = useQuery(GET_ASSETS, {
    errorPolicy: 'all',
  });

  // Get time range for metrics (last 24 hours)
  const getTimeRange = () => {
    const now = Math.floor(Date.now() / 1000);
    const twentyFourHoursAgo = now - (24 * 60 * 60);
    return { after: twentyFourHoursAgo, before: now };
  };

  const { after, before } = React.useMemo(() => getTimeRange(), []);

  // Query for materializations
  const { data: materializationsData, loading: matLoading, refetch: refetchMat } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      metricsFilter: { assetSelection: '' },
      metricsStoreType: 'VICTORIA_METRICS',
      metricsSelector: {
        metricName: '__dagster_materializations',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
  });

  // Query for failures
  const { data: failuresData, loading: failLoading, refetch: refetchFail } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      metricsFilter: { assetSelection: '' },
      metricsStoreType: 'VICTORIA_METRICS',
      metricsSelector: {
        metricName: '__dagster_failed_to_materialize',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
  });

  // Query for freshness pass rate
  const { data: freshnessData, loading: freshnessLoading, refetch: refetchFreshness } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      metricsFilter: { assetSelection: '' },
      metricsStoreType: 'VICTORIA_METRICS',
      metricsSelector: {
        metricName: '__dagster_freshness_pass_rate',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'AVERAGE',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
  });

  // Query for check failures
  const { data: checkFailuresData, loading: checkFailuresLoading, refetch: refetchCheckFailures } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      metricsFilter: { assetSelection: '' },
      metricsStoreType: 'VICTORIA_METRICS',
      metricsSelector: {
        metricName: '__dagster_asset_check_errors',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
  });

  // Check if settings are configured
  React.useEffect(() => {
    const checkSettings = async () => {
      try {
        const hasConfigured = await AsyncStorage.getItem('dagster_api_url');
        setHasConfiguredSettings(!!hasConfigured);
      } catch (error) {
        console.warn('Error checking settings:', error);
      } finally {
        setIsCheckingSettings(false);
      }
    };
    checkSettings();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('Refreshing dashboard data...');
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        refetchRuns(),
        refetchJobs(),
        refetchAssets(),
        refetchMat(),
        refetchFail(),
        refetchFreshness(),
        refetchCheckFailures(),
      ]);

      // Check if any queries failed
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} queries failed during refresh`);
      }

      console.log('Dashboard refresh completed');
      showToast('Dashboard refreshed', 'success');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      showToast('Failed to refresh dashboard', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [refetchRuns, refetchJobs, refetchAssets, refetchMat, refetchFail, refetchFreshness, refetchCheckFailures, showToast]);

  const handleDeploymentChange = (deployment: DagsterCloudDeployment) => {
    setCurrentDeployment(deployment.deploymentName);

    // Update the Apollo client URL to point to the new deployment
    updateApolloClientUrl(deployment.organizationName, deployment.deploymentName);

    console.log('Switching to deployment:', deployment);

    // Refetch all data from the new deployment
    setTimeout(() => {
      refetchRuns();
      refetchJobs();
      refetchAssets();
      refetchMat();
      refetchFail();
      refetchFreshness();
      refetchCheckFailures();
    }, 1000); // Small delay to ensure Apollo client has updated
  };

  const handleRunPress = (run: any) => {
    navigation.navigate('Runs', { 
      screen: 'RunDetail', 
      params: { runId: run.runId } 
    });
  };

  const handlePipelinePress = (pipeline: any) => {
    // Since pipeline.id is actually a run ID, we need to pass it as jobId
    navigation.navigate('Jobs', {
      screen: 'JobsList',
      params: { navigateToJob: pipeline.id }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILURE':
        return '#f44336';
      case 'RUNNING':
        return '#2196f3';
      default:
        return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return formatDagsterDate(dateString);
  };

  // Helper function to format large numbers
  const formatCount = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  // Calculate metrics (must be before early return to follow Rules of Hooks)
  const materializationCount = React.useMemo(() => {
    return materializationsData?.reportingMetricsByAssetSelection?.metrics?.[0]?.aggregateValue || 0;
  }, [materializationsData]);

  const failureCount = React.useMemo(() => {
    return failuresData?.reportingMetricsByAssetSelection?.metrics?.[0]?.aggregateValue || 0;
  }, [failuresData]);

  const freshnessPassRate = React.useMemo(() => {
    const value = freshnessData?.reportingMetricsByAssetSelection?.metrics?.[0]?.aggregateValue;
    if (value === undefined || value === null) return null;
    return Math.round(value * 100);
  }, [freshnessData]);

  const checkFailureCount = React.useMemo(() => {
    return checkFailuresData?.reportingMetricsByAssetSelection?.metrics?.[0]?.aggregateValue || 0;
  }, [checkFailuresData]);

  const metricsLoading = matLoading || failLoading || freshnessLoading || checkFailuresLoading;

  // Repository Icon Component
  const RepositoryIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.667 5.00004H10.0003L8.33366 3.33337H3.33366C2.41699 3.33337 1.67533 4.08337 1.67533 5.00004L1.66699 15C1.66699 15.9167 2.41699 16.6667 3.33366 16.6667H16.667C17.5837 16.6667 18.3337 15.9167 18.3337 15V6.66671C18.3337 5.75004 17.5837 5.00004 16.667 5.00004ZM16.667 15H3.33366V6.66671H16.667V15Z"
        fill={color}
      />
    </Svg>
  );

  if (runsLoading || jobsLoading || assetsLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <ScrollView style={styles.scrollView}>
          <StatsSkeleton />
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recent Runs</Text>
            </View>
            <CardSkeletonList count={3} />
          </View>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Active Pipelines</Text>
            </View>
            <CardSkeletonList count={3} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Only use live data
  const recentRuns = runsData?.runsOrError?.results || [];
  const runs = jobsData?.runsOrError?.results || [];
  const uniquePipelines = runs.reduce((acc: any[], run: any) => {
    if (!acc.find(p => p.name === run.pipelineName)) {
      acc.push({ id: run.id, name: run.pipelineName, status: run.status });
    }
    return acc;
  }, []);
  const assets = assetsData?.assetsOrError?.nodes || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {!hasConfiguredSettings && !isCheckingSettings && (
          <Card style={[styles.card, { marginTop: 4 }]}>
            <Card.Content>
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Welcome to Dagster+ Mobile!
                </Text>
                <Text style={styles.mockDataNotice}>
                  Please configure your settings to get started
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Settings')}
                  style={styles.configureButton}
                >
                  Configure Settings
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        {hasConfiguredSettings && (runsError || jobsError || assetsError) && (
          <Card style={[styles.card, { marginTop: 4 }]}>
            <Card.Content>
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Unable to connect to your Dagster instance
                </Text>
                <Text style={styles.mockDataNotice}>
                  Please check your settings and ensure your API token is valid
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Settings')}
                  style={styles.configureButton}
                >
                  Configure Settings
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
        {hasConfiguredSettings && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <CompassPromptPills
              prompts={[
                {
                  label: "What's broken right now?",
                  prompt:
                    'What is currently failing or degraded across this deployment — runs, assets, sensors, schedules? Rank by severity.',
                },
                {
                  label: 'Last 24h summary',
                  prompt:
                    'Summarize what happened in this deployment in the last 24 hours — materializations, failures, slowdowns, and anything unusual.',
                },
                {
                  label: 'Where are credits going?',
                  prompt:
                    'Where is Dagster+ credit consumption concentrated right now? Which assets or jobs are the top spenders this week?',
                },
                {
                  label: 'Health check',
                  prompt:
                    'Give me a quick health snapshot of this deployment: freshness status, asset check status, recent failure rate, and anything I should look at.',
                },
              ]}
            />
          </View>
        )}
        {hasConfiguredSettings && !runsError && !jobsError && !assetsError && (
          metricsLoading ? (
            <View style={{ marginTop: 4, marginHorizontal: 16 }}>
              <StatsSkeleton />
            </View>
          ) : (
            <Card style={[styles.card, { marginTop: 4 }]}>
              <Card.Content>
                <Text style={[styles.metricsTimeRange, { color: theme.colors.onSurfaceVariant }]}>Last 24 hours</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{formatCount(materializationCount)}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Materializations</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: failureCount > 0 ? '#f44336' : theme.colors.primary }]}>{formatCount(failureCount)}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Failures</Text>
                  </View>
                  {freshnessPassRate !== null && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{freshnessPassRate}%</Text>
                      <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Freshness</Text>
                    </View>
                  )}
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: checkFailureCount > 0 ? '#f44336' : theme.colors.primary }]}>{formatCount(checkFailureCount)}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Check Failures</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )
        )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Recent Runs</Text>
        </View>
        {recentRuns.length === 0 ? (
          <EmptyState
            icon="play-circle-outline"
            title="No Recent Runs"
            description="Run history will appear here once jobs start executing"
          />
        ) : (
          recentRuns.map((run: any) => (
            <TouchableOpacity
              key={run.id}
              style={styles.cardTouchable}
              onPress={() => handleRunPress(run)}
              activeOpacity={1}
              delayPressIn={100}
            >
              <Card style={styles.card} mode="elevated">
                <Card.Content>
                  <View style={styles.runHeader}>
                    <Text style={styles.runName} numberOfLines={1} ellipsizeMode="tail">{run.pipelineName}</Text>
                  </View>
                  <View style={styles.runDetailsRow}>
                    <View style={styles.runDetailsContainer}>
                      <Text style={[styles.runId, { color: theme.colors.onSurfaceVariant }]}>Run ID: {run.runId}</Text>
                      {run.startTime && (
                        <Text style={[styles.runTime, { color: theme.colors.onSurfaceVariant }]}>Started: {formatDagsterDate(run.startTime)} {formatDagsterTime(run.startTime)}</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(run.status) }]}>
                      <Text style={styles.statusText}>{run.status}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Active Pipelines</Text>
        </View>
        {uniquePipelines.length === 0 ? (
          <EmptyState
            icon="account-tree"
            title="No Active Pipelines"
            description="Your data pipelines will be listed here once they're configured"
            actionLabel="Configure Settings"
            onActionPress={() => navigation.navigate('Settings')}
          />
        ) : (
          uniquePipelines.slice(0, 3).map((pipeline: any) => (
            <TouchableOpacity
              key={pipeline.id}
              style={styles.cardTouchable}
              onPress={() => handlePipelinePress(pipeline)}
              activeOpacity={1}
              delayPressIn={100}
            >
              <Card style={styles.card} mode="elevated">
                <Card.Content>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobName} numberOfLines={1} ellipsizeMode="tail">{pipeline.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pipeline.status) }]}>
                      <Text style={styles.statusText}>{pipeline.status}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
        
        {showDeploymentSelector && (
          <DeploymentSelector
            currentDeployment={currentDeployment}
            onDeploymentChange={handleDeploymentChange}
            onClose={() => setShowDeploymentSelector(false)}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    elevation: 2,
  },
  metricsTimeRange: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  runItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
  },
  runHeader: {
    marginBottom: 8,
  },
  runName: {
    fontSize: 16,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  runDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  runDetailsContainer: {
    flex: 1,
    marginRight: 12,
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
    fontSize: 12,
  },
  runTime: {
    fontSize: 12,
    marginTop: 2,
  },
  jobItem: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 3,
  },
  jobName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  jobStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  jobDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  mockDataNotice: {
    fontSize: 12,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 4,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySection: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  cardTouchable: {
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configureButton: {
    marginTop: 8,
  },
});

export default DashboardScreen; 