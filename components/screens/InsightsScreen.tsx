import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useQuery } from '@apollo/client';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../ThemeProvider';
import { GET_INSIGHTS_ASSETS_SELECTION, GET_INSIGHTS_ASSETS, GET_INSIGHTS_UPDATE_TIME, GET_CATALOG_VIEWS } from '../../lib/graphql/queries';
import { CatalogView } from '../../lib/types/dagster';

interface Metric {
  label: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface HourlyChart {
  title: string;
  labels: string[];
  data: number[];
}

interface AssetBreakdown {
  title: string;
  assets: Array<{
    name: string;
    value: string | number;
    assetKey: string[]; // Path array for navigation
  }>;
}

interface InsightsData {
  topMetrics?: Metric[];
  performanceMetrics?: Metric[];
  hourlyCharts?: HourlyChart[];
  assetBreakdowns?: AssetBreakdown[];
}

interface InsightsScreenProps {
  navigation: any;
}

const screenWidth = Dimensions.get('window').width;

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
    if (value < 60) return `${value.toFixed(2)} sec`;
    if (value < 3600) return `${(value / 60).toFixed(2)} min`;
    return `${(value / 3600).toFixed(2)} hours`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

// Helper function to determine change type
const determineChangeType = (change?: number): 'positive' | 'negative' | 'neutral' => {
  if (change === undefined || change === null) return 'neutral';
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
};

// Parse GraphQL response into insights data
const parseInsightsResponse = (
  materializationsData: any,
  failuresData: any,
  creditsData: any,
  executionTimeData: any,
  retriesData: any,
  checkErrorsData: any,
  successRateData: any,
  checkSuccessRateData: any,
  freshnessRateData: any,
  timeToResolutionData: any,
  assetsMaterializationsData: any,
  assetsFailuresData: any,
  assetsCreditsData: any,
  assetsExecutionTimeData: any,
  assetsRetriesData: any,
  assetsCheckErrorsData: any,
  assetsCheckWarningsData: any,
  assetsFreshnessFailuresData: any
): InsightsData => {
  const { after, before } = getTimeRange();
  
  // Extract top metrics from aggregate values
  const topMetrics: Metric[] = [];
  
  // Materialization success rate
  if (successRateData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = successRateData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    topMetrics.push({
      label: 'Materialization success rate',
      value: formatMetricValue(current, 'success_rate'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'success_rate')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(change),
    });
  }
  
  // Avg time to resolution
  if (timeToResolutionData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = timeToResolutionData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    topMetrics.push({
      label: 'Avg. time to resolution',
      value: formatMetricValue(current, 'time'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'time')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(-change), // Negative is good for time
    });
  }
  
  // Freshness pass rate
  if (freshnessRateData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = freshnessRateData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    topMetrics.push({
      label: 'Freshness pass rate',
      value: formatMetricValue(current, 'rate'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'rate')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(change),
    });
  }
  
  // Check success rate
  if (checkSuccessRateData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = checkSuccessRateData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    topMetrics.push({
      label: 'Check success rate',
      value: formatMetricValue(current, 'success_rate'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'success_rate')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(change),
    });
  }
  
  // Extract performance metrics
  const performanceMetrics: Metric[] = [];
  
  // Materialization count
  if (materializationsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = materializationsData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Materialization count',
      value: formatMetricValue(current, 'count'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'count')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(change),
    });
  }
  
  // Failure count
  if (failuresData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = failuresData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Failure count',
      value: formatMetricValue(current, 'count'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'count')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(-change), // Negative is good for failures
    });
  }
  
  // Dagster credits
  if (creditsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = creditsData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Dagster credits',
      value: formatMetricValue(current, 'count'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'count')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(change),
    });
  }
  
  // Step execution time
  if (executionTimeData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = executionTimeData.reportingMetricsByAssetSelection.metrics[0];
    const current = (entry.aggregateValue || 0) / 1000 / 3600; // Convert ms to hours
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Step execution time',
      value: `${current.toFixed(2)} hours`,
      previousValue: change !== undefined ? `${(current - (change / 100) * current).toFixed(2)} prev period` : undefined,
      change: change,
      changeType: determineChangeType(-change), // Negative is good for time
    });
  }
  
  // Retry count
  if (retriesData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = retriesData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Retry count',
      value: formatMetricValue(current, 'count'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'count')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(-change), // Negative is good for retries
    });
  }
  
  // Check error count
  if (checkErrorsData?.reportingMetricsByAssetSelection?.metrics?.[0]) {
    const entry = checkErrorsData.reportingMetricsByAssetSelection.metrics[0];
    const current = entry.aggregateValue || 0;
    const change = entry.aggregateValueChange?.change;
    performanceMetrics.push({
      label: 'Check error count',
      value: formatMetricValue(current, 'count'),
      previousValue: change !== undefined ? `${formatMetricValue(current - (change / 100) * current, 'count')} prev period` : undefined,
      change: change,
      changeType: determineChangeType(-change), // Negative is good for errors
    });
  }
  
  // Extract hourly charts
  const hourlyCharts: HourlyChart[] = [];
  
  // Helper to create sparse labels (show each date only once)
  const createSparseLabels = (timestamps: number[]) => {
    const seenDates = new Set<string>();
    return timestamps.map((ts: number) => {
      const date = new Date(ts * 1000);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      // Only show label if we haven't seen this date yet
      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr);
        return dateStr;
      }
      return '';
    });
  };

  // Materializations by hour
  if (materializationsData?.reportingMetricsByAssetSelection) {
    const data = materializationsData.reportingMetricsByAssetSelection;
    const timestamps = data.timestamps || [];
    const values = data.metrics?.[0]?.values || [];
    if (values.length > 0) {
      hourlyCharts.push({
        title: 'Materializations by hour',
        labels: createSparseLabels(timestamps),
        data: values,
      });
    }
  }

  // Failures by hour
  if (failuresData?.reportingMetricsByAssetSelection) {
    const data = failuresData.reportingMetricsByAssetSelection;
    const timestamps = data.timestamps || [];
    const values = data.metrics?.[0]?.values || [];
    if (values.length > 0) {
      hourlyCharts.push({
        title: 'Failures by hour',
        labels: createSparseLabels(timestamps),
        data: values,
      });
    }
  }

  // Dagster credits by hour
  if (creditsData?.reportingMetricsByAssetSelection) {
    const data = creditsData.reportingMetricsByAssetSelection;
    const timestamps = data.timestamps || [];
    const values = data.metrics?.[0]?.values || [];
    if (values.length > 0) {
      hourlyCharts.push({
        title: 'Dagster credits by hour',
        labels: createSparseLabels(timestamps),
        data: values,
      });
    }
  }
  
  // Extract asset breakdowns
  const assetBreakdowns: AssetBreakdown[] = [];
  
  // Helper function to create asset breakdown from data
  const createAssetBreakdown = (data: any, title: string, metricName: string): AssetBreakdown | null => {
    if (!data?.reportingMetricsByAsset?.metrics) return null;
    
    const assets = data.reportingMetricsByAsset.metrics
      .filter((m: any) => m.entity?.assetKey && m.entity?.__typename === 'ReportingAsset')
      .slice(0, 10)
      .map((m: any) => ({
        name: m.entity.assetKey.path.join(' / '),
        value: formatMetricValue(m.aggregateValue || 0, metricName),
        assetKey: m.entity.assetKey.path,
      }));
    
    if (assets.length > 0) {
      return { title, assets };
    }
    return null;
  };
  
  // Top assets by materialization count
  const materializationsBreakdown = createAssetBreakdown(
    assetsMaterializationsData,
    'Top assets by materialization count',
    'count'
  );
  if (materializationsBreakdown) assetBreakdowns.push(materializationsBreakdown);
  
  // Top assets by failure count
  const failuresBreakdown = createAssetBreakdown(
    assetsFailuresData,
    'Top assets by failure count',
    'count'
  );
  if (failuresBreakdown) assetBreakdowns.push(failuresBreakdown);
  
  // Top assets by Dagster credits
  const creditsBreakdown = createAssetBreakdown(
    assetsCreditsData,
    'Top assets by Dagster credits',
    'count'
  );
  if (creditsBreakdown) assetBreakdowns.push(creditsBreakdown);
  
  // Top assets by execution time
  const executionTimeBreakdown = createAssetBreakdown(
    assetsExecutionTimeData,
    'Top assets by execution time',
    'time'
  );
  if (executionTimeBreakdown) assetBreakdowns.push(executionTimeBreakdown);
  
  // Top assets by retry count
  const retriesBreakdown = createAssetBreakdown(
    assetsRetriesData,
    'Top assets by retry count',
    'count'
  );
  if (retriesBreakdown) assetBreakdowns.push(retriesBreakdown);
  
  // Top assets by check error count
  const checkErrorsBreakdown = createAssetBreakdown(
    assetsCheckErrorsData,
    'Top assets by check error count',
    'count'
  );
  if (checkErrorsBreakdown) assetBreakdowns.push(checkErrorsBreakdown);
  
  // Top assets by check warning count
  const checkWarningsBreakdown = createAssetBreakdown(
    assetsCheckWarningsData,
    'Top assets by check warning count',
    'count'
  );
  if (checkWarningsBreakdown) assetBreakdowns.push(checkWarningsBreakdown);
  
  // Top assets by freshness failure count
  const freshnessFailuresBreakdown = createAssetBreakdown(
    assetsFreshnessFailuresData,
    'Top assets by freshness failure count',
    'count'
  );
  if (freshnessFailuresBreakdown) assetBreakdowns.push(freshnessFailuresBreakdown);
  
  return {
    topMetrics,
    performanceMetrics,
    hourlyCharts,
    assetBreakdowns,
  };
};

const InsightsScreen: React.FC<InsightsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const [shouldFetch, setShouldFetch] = React.useState(false);
  const [selectedView, setSelectedView] = React.useState<'all' | string>('all');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Memoize time range to prevent queries from refetching on every render
  const { after, before } = React.useMemo(() => getTimeRange(), [refreshKey]);

  // Only fetch data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setShouldFetch(true);
      return () => {
        // Keep shouldFetch true even when blurred to maintain data
      };
    }, [])
  );

  // Query for catalog views
  const { data: catalogViewsData } = useQuery(GET_CATALOG_VIEWS, {
    errorPolicy: 'all',
  });

  // Get the asset selection string based on selected view - memoized to prevent unnecessary refetches
  const assetSelection = React.useMemo(() => {
    if (selectedView === 'all') return '';

    const catalogViews = catalogViewsData?.catalogViews;
    if (!catalogViews) return '';

    const selectedCatalogView = catalogViews.find((v: CatalogView) => v.id === selectedView);
    if (!selectedCatalogView) return '';

    // Use the querySelection from the catalog view
    return selectedCatalogView.selection?.querySelection || '';
  }, [selectedView, catalogViewsData]);

  // Get selected view name for display
  const getSelectedViewName = () => {
    if (selectedView === 'all') return 'All Assets';

    const catalogViews = catalogViewsData?.catalogViews;
    if (catalogViews) {
      const view = catalogViews.find((v: CatalogView) => v.id === selectedView);
      return view ? view.name : 'All Assets';
    }
    return 'All Assets';
  };

  // Common variables for queries - memoized to prevent unnecessary refetches
  const commonVariables = React.useMemo(() => ({
    metricsFilter: { assetSelection },
    metricsStoreType: 'VICTORIA_METRICS' as const,
  }), [assetSelection]);

  // Memoize query variables to prevent unnecessary refetches
  const materializationsVariables = React.useMemo(() => ({
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
  }), [commonVariables, after, before]);

  // Fetch all the different metrics - only when screen is focused
  const { data: materializationsData, loading: matLoading, refetch: refetchMat } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: materializationsVariables,
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  const failuresVariables = React.useMemo(() => ({
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
  }), [commonVariables, after, before]);

  const { data: failuresData, loading: failLoading, refetch: refetchFail } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: failuresVariables,
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  const { data: creditsData, loading: creditsLoading, refetch: refetchCredits } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
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
    skip: !shouldFetch,
  });
  
  const { data: executionTimeData, loading: execLoading, refetch: refetchExec } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_execution_time_per_asset_ms',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  const { data: retriesData, loading: retriesLoading, refetch: refetchRetries } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
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
    skip: !shouldFetch,
  });
  
  const { data: checkErrorsData, loading: checkErrorsLoading, refetch: refetchCheckErrors } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
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
    skip: !shouldFetch,
  });
  
  const { data: successRateData, loading: successRateLoading, refetch: refetchSuccessRate } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
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
    skip: !shouldFetch,
  });
  
  const { data: checkSuccessRateData, loading: checkSuccessRateLoading, refetch: refetchCheckSuccessRate } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_asset_check_success_rate',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'AVERAGE',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  const { data: freshnessRateData, loading: freshnessRateLoading, refetch: refetchFreshnessRate } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
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
    skip: !shouldFetch,
  });
  
  const { data: timeToResolutionData, loading: timeToResolutionLoading, refetch: refetchTimeToResolution } = useQuery(GET_INSIGHTS_ASSETS_SELECTION, {
    variables: {
      ...commonVariables,
      metricsSelector: {
        metricName: '__dagster_asset_time_to_resolution',
        after,
        before,
        granularity: 'HOURLY',
        aggregationFunction: 'AVERAGE',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  // Fetch asset breakdown data for different metrics
  const { data: assetsMaterializationsData, loading: assetsMatLoading, refetch: refetchAssetsMat } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_materializations',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsFailuresData, loading: assetsFailLoading, refetch: refetchAssetsFail } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_failed_to_materialize',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsCreditsData, loading: assetsCreditsLoading, refetch: refetchAssetsCredits } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_dagster_credits',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsExecutionTimeData, loading: assetsExecTimeLoading, refetch: refetchAssetsExecTime } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_execution_time_per_asset_ms',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'AVERAGE',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsRetriesData, loading: assetsRetriesLoading, refetch: refetchAssetsRetries } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_step_retries',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsCheckErrorsData, loading: assetsCheckErrorsLoading, refetch: refetchAssetsCheckErrors } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_asset_check_errors',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsCheckWarningsData, loading: assetsCheckWarningsLoading, refetch: refetchAssetsCheckWarnings } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_asset_check_warnings',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });

  const { data: assetsFreshnessFailuresData, loading: assetsFreshnessFailuresLoading, refetch: refetchAssetsFreshnessFailures } = useQuery(GET_INSIGHTS_ASSETS, {
    variables: {
      metricsFilter: { assetSelection, limit: 1000 },
      metricsSelector: {
        metricName: '__dagster_freshness_failures',
        after,
        before,
        granularity: 'WEEKLY',
        aggregationFunction: 'SUM',
        sortTarget: ['AGGREGATION_VALUE'],
        sortDirection: ['DESCENDING'],
      },
      metricsStoreType: 'VICTORIA_METRICS' as const,
    },
    errorPolicy: 'all',
    skip: !shouldFetch,
  });
  
  const loading = matLoading || failLoading || creditsLoading || execLoading || retriesLoading || 
                  checkErrorsLoading || successRateLoading || checkSuccessRateLoading || 
                  freshnessRateLoading || timeToResolutionLoading || assetsMatLoading || 
                  assetsFailLoading || assetsCreditsLoading || assetsExecTimeLoading || 
                  assetsRetriesLoading || assetsCheckErrorsLoading || assetsCheckWarningsLoading || 
                  assetsFreshnessFailuresLoading;
  
  // Parse all the data
  const insightsData: InsightsData | null = React.useMemo(() => {
    if (loading) return null;
    
    return parseInsightsResponse(
      materializationsData,
      failuresData,
      creditsData,
      executionTimeData,
      retriesData,
      checkErrorsData,
      successRateData,
      checkSuccessRateData,
      freshnessRateData,
      timeToResolutionData,
      assetsMaterializationsData,
      assetsFailuresData,
      assetsCreditsData,
      assetsExecutionTimeData,
      assetsRetriesData,
      assetsCheckErrorsData,
      assetsCheckWarningsData,
      assetsFreshnessFailuresData
    );
  }, [
    materializationsData,
    failuresData,
    creditsData,
    executionTimeData,
    retriesData,
    checkErrorsData,
    successRateData,
    checkSuccessRateData,
    freshnessRateData,
    timeToResolutionData,
    assetsMaterializationsData,
    assetsFailuresData,
    assetsCreditsData,
    assetsExecutionTimeData,
    assetsRetriesData,
    assetsCheckErrorsData,
    assetsCheckWarningsData,
    assetsFreshnessFailuresData,
    loading,
  ]);

  const onRefresh = React.useCallback(async () => {
    // Update refresh key to recalculate time range
    setRefreshKey(prev => prev + 1);
    await Promise.all([
    refetchMat(),
    refetchFail(),
    refetchCredits(),
    refetchExec(),
    refetchRetries(),
    refetchCheckErrors(),
    refetchSuccessRate(),
    refetchCheckSuccessRate(),
    refetchFreshnessRate(),
    refetchTimeToResolution(),
    refetchAssetsMat(),
    refetchAssetsMat(),
    refetchAssetsFail(),
    refetchAssetsCredits(),
    refetchAssetsExecTime(),
    refetchAssetsRetries(),
    refetchAssetsCheckErrors(),
    refetchAssetsCheckWarnings(),
    refetchAssetsFreshnessFailures(),
    ]);
  }, [
    refetchMat,
    refetchFail,
    refetchCredits,
    refetchExec,
    refetchRetries,
    refetchCheckErrors,
    refetchSuccessRate,
    refetchCheckSuccessRate,
    refetchFreshnessRate,
    refetchTimeToResolution,
    refetchAssetsMat,
    refetchAssetsFail,
    refetchAssetsCredits,
    refetchAssetsExecTime,
    refetchAssetsRetries,
    refetchAssetsCheckErrors,
    refetchAssetsCheckWarnings,
    refetchAssetsFreshnessFailures,
  ]);

  const defaultChartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.dark ? '255, 255, 255' : '79, 67, 221'}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.dark ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
    strokeWidth: 2,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '0',
      strokeWidth: '0',
      stroke: 'transparent',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: theme.dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      strokeDasharray: '0',
    },
  };

  const formatChange = (change?: number): string => {
    if (change === undefined || change === null) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change?: number, changeType?: string): string => {
    if (change === undefined || change === null) return theme.colors.onSurfaceVariant;
    if (changeType === 'positive') return '#4caf50';
    if (changeType === 'negative') return '#f44336';
    return theme.colors.onSurfaceVariant;
  };

  const renderMetric = (metric: Metric, index: number) => {
    const changeColor = getChangeColor(metric.change, metric.changeType);
    const changeText = metric.change !== undefined ? formatChange(metric.change) : '';
    
    return (
      <View key={index} style={styles.metricCard}>
        <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
          {metric.label}
        </Text>
        <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
          {metric.value}
        </Text>
        {metric.previousValue && (
          <View style={styles.metricComparison}>
            <Text
              style={[styles.metricPrevious, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {metric.previousValue}
            </Text>
            {changeText && (
              <Text
                style={[styles.metricChange, { color: changeColor }]}
                numberOfLines={1}
              >
                {changeText}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHourlyChart = (chart: HourlyChart, index: number) => {
    const chartWidth = screenWidth - 64;
    const chartHeight = 200;

    // Ensure we have data
    if (!chart.data || chart.data.length === 0) {
      return null;
    }

    return (
      <Card key={index} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
            {chart.title}
          </Title>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: chart.labels || [],
                datasets: [{
                  data: chart.data,
                }],
              }}
              width={chartWidth}
              height={chartHeight}
              chartConfig={defaultChartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              withDots={false}
              withShadow={false}
              fromZero={true}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderAssetBreakdown = (breakdown: AssetBreakdown, index: number) => {
    const handleAssetPress = (asset: { name: string; value: string | number; assetKey: string[] }) => {
      navigation.navigate('Catalog', {
        screen: 'AssetDetail',
        params: {
          assetKey: { path: asset.assetKey }
        }
      });
    };

    return (
      <Card key={index} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {breakdown.title}
          </Title>
          {breakdown.assets && breakdown.assets.length > 0 ? (
            breakdown.assets.slice(0, 10).map((asset, assetIndex) => (
              <TouchableOpacity
                key={assetIndex}
                style={styles.assetRow}
                onPress={() => handleAssetPress(asset)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[styles.assetName, { color: theme.colors.primary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {assetIndex + 1}. {asset.name}
                </Text>
                <Text style={[styles.assetValue, { color: theme.colors.onSurfaceVariant }]}>
                  {asset.value}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No data available
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading insights...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Button
          mode="outlined"
          onPress={() => setMenuVisible(true)}
          style={styles.viewButton}
          textColor={theme.colors.onSurface}
          icon="chevron-down"
        >
          {getSelectedViewName()}
        </Button>

        <Modal
          visible={menuVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                  Select View
                </Text>
                <TouchableOpacity onPress={() => setMenuVisible(false)}>
                  <Text style={[styles.closeButton, { color: theme.colors.primary }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={[
                  { id: 'all', name: 'All Assets' },
                  ...(catalogViewsData?.catalogViews?.map((view: CatalogView) => ({
                    id: view.id,
                    name: view.name
                  })) || [])
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedView(item.id);
                      setMenuVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      selectedView === item.id && { backgroundColor: theme.colors.primaryContainer }
                    ]}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: theme.colors.onSurface },
                      selectedView === item.id && { color: theme.colors.onPrimaryContainer }
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.modalList}
              />
            </View>
          </View>
        </Modal>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {insightsData && (
          <>
            {/* Top Metrics */}
            {insightsData.topMetrics && insightsData.topMetrics.length > 0 && (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.metricsGrid}>
                    {insightsData.topMetrics.map((metric, index) => renderMetric(metric, index))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Performance Metrics */}
            {insightsData.performanceMetrics && insightsData.performanceMetrics.length > 0 && (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Performance metrics
                  </Title>
                  <View style={styles.metricsGrid}>
                    {insightsData.performanceMetrics.map((metric, index) => renderMetric(metric, index))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Hourly Breakdown Charts */}
            {insightsData.hourlyCharts && insightsData.hourlyCharts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Hourly breakdown
                  </Title>
                </View>
                {insightsData.hourlyCharts.map((chart, index) => renderHourlyChart(chart, index))}
              </>
            )}

            {/* Asset Breakdown */}
            {insightsData.assetBreakdowns && insightsData.assetBreakdowns.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Asset breakdown
                  </Title>
                </View>
                {insightsData.assetBreakdowns.map((breakdown, index) => renderAssetBreakdown(breakdown, index))}
              </>
            )}

            {!insightsData.topMetrics && 
             !insightsData.performanceMetrics && 
             !insightsData.hourlyCharts && 
             !insightsData.assetBreakdowns && (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <Title style={{ color: theme.colors.onSurface }}>No Insights Available</Title>
                  <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                    Unable to load insights data. Please check your connection and try again.
                  </Paragraph>
                </Card.Content>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 8,
  },
  viewButton: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricComparison: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  metricPrevious: {
    fontSize: 11,
    flex: 1,
    flexShrink: 1,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 0,
    marginLeft: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  assetName: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  assetValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default InsightsScreen;
