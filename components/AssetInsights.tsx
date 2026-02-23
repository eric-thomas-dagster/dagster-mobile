import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { useTheme } from './ThemeProvider';
import { GET_INSIGHTS_ASSETS_SELECTION } from '../lib/graphql/queries';

interface AssetInsightsProps {
  assetKey: { path: string[] };
}

interface Metric {
  label: string;
  value: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
}

// Helper function to get time range (7 days ago to now)
const getTimeRange = () => {
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - (7 * 24 * 60 * 60);
  return { after: sevenDaysAgo, before: now };
};

// Helper function to format metric value
const formatMetricValue = (value: number, metricName: string): string => {
  if (metricName.includes('rate') || metricName.includes('success')) {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (metricName.includes('time') || metricName.includes('duration')) {
    if (value < 60) return `${value.toFixed(1)}s`;
    if (value < 3600) return `${(value / 60).toFixed(1)}m`;
    return `${(value / 3600).toFixed(1)}h`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

// Helper function to format change
const formatChange = (change?: number): string => {
  if (change === undefined || change === null) return '';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
};

const AssetInsights: React.FC<AssetInsightsProps> = ({ assetKey }) => {
  const { theme } = useTheme();
  const { after, before } = getTimeRange();

  // Create asset selection string from asset key
  const assetSelection = `key:${assetKey.path.join('/')}`;

  const commonVariables = {
    metricsFilter: { assetSelection },
    metricsStoreType: 'VICTORIA_METRICS' as const,
  };

  // Fetch key metrics for this asset
  const { data: materializationsData, loading: matLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
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

  const { data: failuresData, loading: failLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
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

  const { data: executionTimeData, loading: execLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_execution_time_per_asset_ms',
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

  const { data: successRateData, loading: successLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_asset_success_rate',
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

  const { data: creditsData, loading: creditsLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_dagster_credits',
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

  const { data: retriesData, loading: retriesLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_step_retries',
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

  const { data: checkErrorsData, loading: checkErrorsLoading } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
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

  const loading = matLoading || failLoading || execLoading || successLoading ||
                  creditsLoading || retriesLoading || checkErrorsLoading;

  // Parse metrics
  const metrics: Metric[] = React.useMemo(() => {
    if (loading) return [];

    const result: Metric[] = [];

    // Materialization count
    if (materializationsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = materializationsData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Materializations',
        value: formatMetricValue(current, 'count'),
        change,
        changeType: change && change > 0 ? 'positive' : change && change < 0 ? 'negative' : 'neutral',
      });
    }

    // Success rate
    if (successRateData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = successRateData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Success rate',
        value: formatMetricValue(current, 'success_rate'),
        change,
        changeType: change && change > 0 ? 'positive' : change && change < 0 ? 'negative' : 'neutral',
      });
    }

    // Failure count
    if (failuresData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = failuresData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Failures',
        value: formatMetricValue(current, 'count'),
        change,
        changeType: change && change < 0 ? 'positive' : change && change > 0 ? 'negative' : 'neutral',
      });
    }

    // Execution time
    if (executionTimeData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = executionTimeData.reportingMetricsByAssetSelection.metrics[0];
      const current = (entry.aggregateValue || 0) / 1000; // Convert ms to seconds
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Avg. execution time',
        value: formatMetricValue(current, 'time'),
        change,
        changeType: change && change < 0 ? 'positive' : change && change > 0 ? 'negative' : 'neutral',
      });
    }

    // Dagster credits
    if (creditsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = creditsData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Dagster credits',
        value: formatMetricValue(current, 'count'),
        change,
        changeType: 'neutral',
      });
    }

    // Retries
    if (retriesData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = retriesData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Retries',
        value: formatMetricValue(current, 'count'),
        change,
        changeType: change && change < 0 ? 'positive' : change && change > 0 ? 'negative' : 'neutral',
      });
    }

    // Check errors
    if (checkErrorsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
      const entry = checkErrorsData.reportingMetricsByAssetSelection.metrics[0];
      const current = entry.aggregateValue || 0;
      const change = entry.aggregateValueChange?.change;
      result.push({
        label: 'Check errors',
        value: formatMetricValue(current, 'count'),
        change,
        changeType: change && change < 0 ? 'positive' : change && change > 0 ? 'negative' : 'neutral',
      });
    }

    return result;
  }, [
    materializationsData,
    failuresData,
    executionTimeData,
    successRateData,
    creditsData,
    retriesData,
    checkErrorsData,
    loading,
  ]);

  const getChangeColor = (changeType?: string): string => {
    if (changeType === 'positive') return '#4caf50';
    if (changeType === 'negative') return '#f44336';
    return theme.colors.onSurfaceVariant;
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Loading insights...
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>
            No insights data available for this asset (last 7 days)
          </Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          Insights (Last 7 Days)
        </Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {metric.label}
              </Text>
              <Text style={[styles.metricValue, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {metric.value}
              </Text>
              {metric.change !== undefined && metric.change !== null && (
                <Text
                  style={[
                    styles.metricChange,
                    { color: getChangeColor(metric.changeType) }
                  ]}
                  numberOfLines={1}
                >
                  {formatChange(metric.change)}
                </Text>
              )}
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AssetInsights;
