import React from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { GET_TIMELINE_DATA } from '../lib/graphql/queries';
import { parseDagsterTimestamp } from '../lib/utils/dateUtils';
import { useTheme } from './ThemeProvider';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface TimelineViewProps {
  timeRange: '1hr' | '6hr' | '12hr' | '24hr';
  onTimeRangeChange: (range: '1hr' | '6hr' | '12hr' | '24hr') => void;
  navigation?: any;
}

interface TimelineRun {
  id: string;
  runId: string;
  status: string;
  startTime: string;
  endTime?: string;
  pipelineName: string;
  repositoryOrigin?: {
    repositoryLocationName: string;
    repositoryName: string;
  };
}

interface GroupedRuns {
  [repositoryName: string]: {
    [pipelineName: string]: TimelineRun[];
  };
}

const TimelineView: React.FC<TimelineViewProps> = ({ timeRange, onTimeRangeChange, navigation }) => {
  const { theme } = useTheme();
  const { data, loading, error } = useQuery(GET_TIMELINE_DATA, {
    variables: { limit: 200 },
    errorPolicy: 'all',
  });

  // Job Icon Component
  const JobIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.5 18.3333V12.5H5V9.16663H9.16667V7.49996H6.66667V1.66663H13.3333V7.49996H10.8333V9.16663H15V12.5H17.5V18.3333H10.8333V12.5H13.3333V10.8333H6.66667V12.5H9.16667V18.3333H2.5ZM8.33333 5.83329H11.6667V3.33329H8.33333V5.83329ZM4.16667 16.6666H7.5V14.1666H4.16667V16.6666ZM12.5 16.6666H15.8333V14.1666H12.5V16.6666Z"
        fill={color}
      />
    </Svg>
  );

  // Only use live data
  const runs = data?.runsOrError?.results || [];

  // Group runs by repository and pipeline name
  const groupedRuns: GroupedRuns = runs.reduce((acc: GroupedRuns, run: TimelineRun) => {
    const repoName = run.repositoryOrigin?.repositoryLocationName || 'Unknown';
    
    if (!acc[repoName]) {
      acc[repoName] = {};
    }
    
    if (!acc[repoName][run.pipelineName]) {
      acc[repoName][run.pipelineName] = [];
    }
    
    acc[repoName][run.pipelineName].push(run);
    return acc;
  }, {});

  // Calculate time range in milliseconds
  const getTimeRangeMs = () => {
    switch (timeRange) {
      case '1hr': return 60 * 60 * 1000;
      case '6hr': return 6 * 60 * 60 * 1000;
      case '12hr': return 12 * 60 * 60 * 1000;
      case '24hr': return 24 * 60 * 60 * 1000;
      default: return 6 * 60 * 60 * 1000;
    }
  };

  // Filter runs within the time range
  const now = new Date();
  const timeRangeMs = getTimeRangeMs();
  const filteredGroupedRuns: GroupedRuns = {};

  Object.keys(groupedRuns).forEach(repoName => {
    const repoRuns = groupedRuns[repoName];
    const filteredRepoRuns: { [pipelineName: string]: TimelineRun[] } = {};

    Object.keys(repoRuns).forEach(pipelineName => {
      const runsInRange = repoRuns[pipelineName].filter(run => {
        const runTime = parseDagsterTimestamp(run.startTime);
        if (!runTime) return false;
        return (now.getTime() - runTime.getTime()) <= timeRangeMs;
      });
      if (runsInRange.length > 0) {
        filteredRepoRuns[pipelineName] = runsInRange;
      }
    });

    if (Object.keys(filteredRepoRuns).length > 0) {
      filteredGroupedRuns[repoName] = filteredRepoRuns;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return '#4caf50';
      case 'FAILURE': return '#f44336';
      case 'RUNNING': return '#2196f3';
      case 'CANCELED': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusCounts = (runs: TimelineRun[]) => {
    const counts = { success: 0, failure: 0, running: 0, other: 0 };
    runs.forEach(run => {
      switch (run.status) {
        case 'SUCCESS': counts.success++; break;
        case 'FAILURE': counts.failure++; break;
        case 'RUNNING': counts.running++; break;
        default: counts.other++; break;
      }
    });
    return counts;
  };

  const handlePipelinePress = (pipelineName: string, runs: TimelineRun[]) => {
    if (!navigation) return;
    
    // Find the most recent run for this pipeline to use as jobId
    const mostRecentRun = runs.reduce((latest: TimelineRun | null, current: TimelineRun) => {
      if (!latest || !latest.startTime) return current;
      if (!current.startTime) return latest;
      const latestTime = parseDagsterTimestamp(latest.startTime);
      const currentTime = parseDagsterTimestamp(current.startTime);
      if (!latestTime || !currentTime) return latest;
      return currentTime > latestTime ? current : latest;
    }, null);
    
    if (mostRecentRun) {
      // Navigate to Jobs tab first, then to JobDetail
      navigation.navigate('Jobs', {
        screen: 'JobDetail',
        params: { jobId: mostRecentRun.id }
      });
    }
  };

  const renderTimelineRow = (pipelineName: string, runs: TimelineRun[]) => {
    const counts = getStatusCounts(runs);
    const totalRuns = runs.length;

    const rowContent = (
      <>
        <View style={styles.pipelineInfo}>
          <View style={styles.pipelineNameContainer}>
            <JobIcon color={theme.colors.onSurface} size={16} />
            <Text style={[styles.pipelineName, { color: theme.colors.primary }]}>{pipelineName}</Text>
          </View>
        </View>
        
        <View style={styles.timelineSection}>
          <View style={styles.timelineContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.timeline}>
                {runs.map((run, index) => (
                  <View
                    key={run.id}
                    style={[
                      styles.runIndicator,
                      { backgroundColor: getStatusColor(run.status) }
                    ]}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
          
          <View style={styles.statusCounts}>
            {counts.success > 0 && (
              <Chip style={[styles.statusChip, { backgroundColor: '#4caf50' }]}>
                {counts.success}
              </Chip>
            )}
            {counts.failure > 0 && (
              <Chip style={[styles.statusChip, { backgroundColor: '#f44336' }]}>
                {counts.failure}
              </Chip>
            )}
            {counts.running > 0 && (
              <Chip style={[styles.statusChip, { backgroundColor: '#2196f3' }]}>
                {counts.running}
              </Chip>
            )}
            {counts.other > 0 && (
              <Chip style={[styles.statusChip, { backgroundColor: '#9e9e9e' }]}>
                {counts.other}
              </Chip>
            )}
          </View>
        </View>
      </>
    );

    if (navigation) {
      return (
        <TouchableOpacity
          key={pipelineName}
          style={[styles.timelineRow, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}
          onPress={() => handlePipelinePress(pipelineName, runs)}
          activeOpacity={0.7}
        >
          {rowContent}
        </TouchableOpacity>
      );
    }

    return (
      <View key={pipelineName} style={[styles.timelineRow, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        {rowContent}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading timeline...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.timeRangeSelector, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={onTimeRangeChange}
          buttons={[
            { value: '1hr', label: '1hr' },
            { value: '6hr', label: '6hr' },
            { value: '12hr', label: '12hr' },
            { value: '24hr', label: '24hr' }
          ]}
          style={styles.timeRangeButtons}
        />
      </View>

      <ScrollView style={styles.timelineList}>
        {Object.keys(filteredGroupedRuns).length === 0 ? (
          <Card style={styles.noDataCard}>
            <Card.Content>
              <Text style={[styles.noDataText, { color: theme.colors.onSurfaceVariant }]}>
                No runs found in the last {timeRange}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          Object.entries(filteredGroupedRuns).map(([repoName, repoRuns]) => (
            <View key={repoName}>
              <View style={[styles.repositoryHeader, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.repositoryName, { color: theme.colors.onSurface }]}>{repoName}</Text>
              </View>
              {Object.entries(repoRuns).map(([pipelineName, runs]) =>
                renderTimelineRow(pipelineName, runs)
              )}
            </View>
          ))
        )}
      </ScrollView>
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
  timeRangeSelector: {
    padding: 16,
    borderBottomWidth: 1,
  },
  timeRangeButtons: {
    marginBottom: 8,
  },
  timelineList: {
    flex: 1,
  },
  timelineRow: {
    marginVertical: 1,
    padding: 16,
  },
  pipelineInfo: {
    marginBottom: 8,
  },
  pipelineNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pipelineName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timelineSection: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  timelineContainer: {
    flex: 1,
    height: 24,
    marginRight: 12,
  },
  statusCounts: {
    flexDirection: 'row',
    gap: 4,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChip: {
    height: 30,
    minWidth: 36,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    paddingHorizontal: 8,
  },
  runIndicator: {
    width: 4,
    height: 16,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  noDataCard: {
    margin: 16,
  },
  repositoryHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  repositoryName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
  },
});

export default TimelineView; 