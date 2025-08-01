import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { GET_RUNS } from '../../lib/graphql/queries';
import { RepositorySelector, Run } from '../../lib/types/dagster';
import { formatDagsterDate, formatDagsterTime } from '../../lib/utils/dateUtils';
import { useTheme } from '../ThemeProvider';

interface RunsScreenProps {
  navigation: any;
  route: any;
}

const RunsScreen: React.FC<RunsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('ALL');
  
  // Handle navigation to specific run from other screens
  React.useEffect(() => {
    if (route.params?.navigateToRun) {
      const runId = route.params.navigateToRun;
      // Clear the parameter to prevent re-navigation
      navigation.setParams({ navigateToRun: undefined });
      // Navigate to the run detail
      navigation.navigate('RunDetail', { runId });
    }
  }, [route.params?.navigateToRun, navigation]);
  
  const { data, loading, refetch, error } = useQuery(GET_RUNS, {
    variables: { limit: 50 },
    errorPolicy: 'all',
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleRunPress = (run: Run) => {
    console.log('RunsScreen - Navigating to RunDetail with runId:', run.id);
    console.log('RunsScreen - Full run object:', run);
    navigation.navigate('RunDetail', { runId: run.id });
  };

  const handleTargetPress = (pipelineName: string) => {
    if (pipelineName !== '__ASSET_JOB') {
      // Find the most recent run for this pipeline to use as jobId
      const runs = data?.runsOrError?.results || [];
      const pipelineRuns = runs.filter((run: any) => run.pipelineName === pipelineName);
      const mostRecentRun = pipelineRuns.reduce((latest: any, current: any) => {
        if (!latest || !latest.startTime) return current;
        if (!current.startTime) return latest;
        return new Date(current.startTime) > new Date(latest.startTime) ? current : latest;
      }, null);
      
      if (mostRecentRun) {
        // Navigate to Jobs tab first, then to JobDetail
        navigation.navigate('Jobs', {
          screen: 'JobDetail',
          params: { jobId: mostRecentRun.id }
        });
      }
    }
  };

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

  const formatDate = (dateString: string) => formatDagsterDate(dateString);
  const formatTime = (dateString: string) => formatDagsterTime(dateString);

  const formatDuration = (startTime: string, endTime: string) => {
    console.log('formatDuration - startTime:', startTime);
    console.log('formatDuration - endTime:', endTime);
    
    // Convert from seconds to milliseconds for Date constructor
    const start = new Date(parseFloat(startTime) * 1000);
    const end = new Date(parseFloat(endTime) * 1000);
    
    console.log('formatDuration - start Date:', start);
    console.log('formatDuration - end Date:', end);
    
    const durationMs = end.getTime() - start.getTime();
    console.log('formatDuration - durationMs:', durationMs);
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    
    const result = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    console.log('formatDuration - result:', result);
    
    return result;
  };

  // Get all unique statuses for filtering
  const allStatuses = React.useMemo(() => {
    const runs = data?.runsOrError?.results || [];
    const statuses = Array.from(new Set(runs.map((run: Run) => run.status)));
    return ['ALL', ...statuses.sort()] as string[];
  }, [data]);

  // Filter runs by search query and status
  const filteredRuns = React.useMemo(() => {
    const runs = data?.runsOrError?.results || [];
    return runs.filter((run: Run) => {
      // Status filter
      const statusMatch = selectedStatus === 'ALL' || run.status === selectedStatus;
      
      // Search filter
      const runName = run.pipelineName.toLowerCase();
      const runId = run.runId.toLowerCase();
      const query = searchQuery.toLowerCase();
      const searchMatch = runName.includes(query) || runId.includes(query);
      
      return statusMatch && searchMatch;
    });
  }, [data, searchQuery, selectedStatus, error]);

  const renderRunItem = ({ item }: { item: Run }) => {
    const statusColor = getStatusColor(item.status);
    
    console.log('renderRunItem - item:', {
      id: item.id,
      runId: item.runId,
      status: item.status,
      startTime: item.startTime,
      endTime: item.endTime,
      pipelineName: item.pipelineName
    });
    
    return (
      <Card style={styles.card} onPress={() => handleRunPress(item)}>
        <Card.Content>
          <View style={styles.runHeader}>
            <Title style={styles.runName}>{item.runId.substring(0, 8)}</Title>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.targetField}>
            <Paragraph style={[styles.targetLabel, { color: theme.colors.onSurfaceVariant }]}>
              Target: 
            </Paragraph>
            <TouchableOpacity 
              onPress={() => handleTargetPress(item.pipelineName)}
              disabled={item.pipelineName === '__ASSET_JOB'}
            >
              <Paragraph style={[
                styles.targetJobName, 
                { 
                  color: item.pipelineName === '__ASSET_JOB' 
                    ? theme.colors.onSurfaceVariant 
                    : theme.colors.primary 
                }
              ]}>
                {item.pipelineName}
              </Paragraph>
            </TouchableOpacity>
          </View>
          {item.startTime && (
            <Paragraph style={[styles.runTime, { color: theme.colors.onSurfaceVariant }]}>
              Started: {formatDate(item.startTime)} at {formatTime(item.startTime)}
            </Paragraph>
          )}
          {item.startTime && item.endTime && (
            <Paragraph style={[styles.runTime, { color: theme.colors.onSurfaceVariant }]}>
              Duration: {formatDuration(item.startTime, item.endTime)}
            </Paragraph>
          )}
          {item.startTime && !item.endTime && (
            <Paragraph style={[styles.runTime, { color: theme.colors.onSurfaceVariant }]}>
              Started: {formatDate(item.startTime)} at {formatTime(item.startTime)}
            </Paragraph>
          )}

        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading runs...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <Searchbar
        placeholder="Search runs..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
        <SegmentedButtons
          value={selectedStatus}
          onValueChange={setSelectedStatus}
          buttons={allStatuses.map((status: string) => ({
            value: status,
            label: status
          }))}
          style={styles.statusFilter}
        />
      </View>
      
      <FlatList
        data={filteredRuns}
        renderItem={renderRunItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery || selectedStatus !== 'ALL' 
                ? 'No runs found matching your filters' 
                : 'No runs found'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    marginBottom: 12,
    elevation: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  runName: {
    fontSize: 16,
    flex: 1,
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
  targetField: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 14,
    marginRight: 4,
  },
  targetJobName: {
    fontSize: 14,
  },
  runTime: {
    fontSize: 14,
    marginBottom: 4,
  },
  runStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    padding: 16,
  },
  statusFilter: {
    marginTop: 8,
  },
});

export default RunsScreen; 