import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { LogEvent } from '../lib/types/dagster';
import { formatDagsterDate, formatDagsterTime } from '../lib/utils/dateUtils';
import { useTheme } from './ThemeProvider';

interface LogsViewerProps {
  logs: LogEvent[];
  loading: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ 
  logs, 
  loading, 
  onRefresh, 
  refreshing = false 
}) => {
  const { theme } = useTheme();
  const [selectedLevel, setSelectedLevel] = React.useState<string>('ALL');
  const [selectedType, setSelectedType] = React.useState<string>('ALL');

  // Debug logging
  React.useEffect(() => {
    console.log('LogsViewer received logs:', logs);
    console.log('Logs length:', logs?.length);
    if (logs && logs.length > 0) {
      console.log('First log entry:', logs[0]);
      console.log('All log entries keys:', logs.map(log => Object.keys(log)));
    }
  }, [logs]);
  const getLogLevelColor = (level: string | undefined) => {
    if (!level) return '#757575'; // Default gray for undefined levels
    
    switch (level.toLowerCase()) {
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      case 'debug':
        return '#757575';
      default:
        return '#4caf50';
    }
  };

  // Parse timestamp - handle Unix timestamps in milliseconds
  const parseTimestamp = (timestamp: any) => {
    if (!timestamp) return null;
    const num = parseFloat(timestamp);
    if (!isNaN(num)) {
      // If it's a large number (Unix timestamp in milliseconds), convert it
      if (num > 1000000000000) {
        return new Date(num).toISOString();
      }
      // If it's a smaller number, assume it's seconds and convert to milliseconds
      return new Date(num * 1000).toISOString();
    }
    return timestamp; // Return as-is if it's already a string
  };

  // Handle different event types
  const getEventDisplay = (event: any) => {
    switch (event.__typename) {
      case 'LogMessageEvent':
        return {
          message: event.message || 'No message',
          level: event.level || 'INFO',
          timestamp: parseTimestamp(event.timestamp),
          stepKey: event.stepKey,
          type: 'Log'
        };
      case 'MaterializationEvent':
        return {
          message: event.message || 'Asset materialized',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp),
          stepKey: event.stepKey,
          type: 'Materialization',
          assetKey: event.assetKey?.path?.join('.')
        };
      case 'RunEnqueuedEvent':
        return {
          message: 'Run enqueued for execution',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Run'
        };
      case 'RunStartingEvent':
        return {
          message: 'Run starting',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Run'
        };
      case 'RunStartEvent':
        return {
          message: 'Run started',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Run'
        };
      case 'RunSuccessEvent':
        return {
          message: 'Run completed successfully',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Run'
        };
      case 'ExecutionStepStartEvent':
        return {
          message: `Step started: ${event.stepKey || 'Unknown step'}`,
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          stepKey: event.stepKey,
          type: 'Step'
        };
      case 'ExecutionStepSuccessEvent':
        return {
          message: `Step completed: ${event.stepKey || 'Unknown step'}`,
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          stepKey: event.stepKey,
          type: 'Step'
        };
      case 'AssetCheckEvaluationEvent':
        return {
          message: 'Asset check evaluation completed',
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Check'
        };
      case 'EngineEvent':
        return {
          message: 'Engine event',
          level: 'DEBUG',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Engine'
        };
      default:
        return {
          message: `Event: ${event.__typename}`,
          level: 'INFO',
          timestamp: parseTimestamp(event.timestamp) || event.eventTime,
          type: 'Other'
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return formatDagsterTime(timestamp);
  };

  const formatDate = (timestamp: string) => {
    return formatDagsterDate(timestamp);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading logs...</Text>
      </View>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.noLogsText}>No logs available for this run</Text>
        </Card.Content>
      </Card>
    );
  }

  // Filter out any invalid log entries and apply filters
  const validLogs = logs.filter(log => log && typeof log === 'object');
  
  // Get all unique levels and types for filtering
  const allLevels = ['ALL', ...Array.from(new Set(validLogs.map(log => {
    const display = getEventDisplay(log);
    return display.level;
  })))];
  
  const allTypes = ['ALL', ...Array.from(new Set(validLogs.map(log => {
    const display = getEventDisplay(log);
    return display.type;
  })))];
  
  // Apply filters
  const filteredLogs = validLogs.filter(log => {
    const display = getEventDisplay(log);
    const levelMatch = selectedLevel === 'ALL' || display.level === selectedLevel;
    const typeMatch = selectedType === 'ALL' || display.type === selectedType;
    return levelMatch && typeMatch;
  });

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={{ color: theme.colors.onSurface }}>Run Logs</Title>
            <Chip mode="outlined" style={styles.logCount}>
              {filteredLogs.length} of {validLogs.length} entries
            </Chip>
          </View>
          
          {/* Filter Controls */}
          <View style={styles.filterContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Level:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {allLevels.map(level => (
                <Chip
                  key={level}
                  mode={selectedLevel === level ? "flat" : "outlined"}
                  onPress={() => setSelectedLevel(level)}
                  style={styles.filterChip}
                  textStyle={{ color: selectedLevel === level ? 'white' : getLogLevelColor(level) }}
                >
                  {level}
                </Chip>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.filterContainer}>
            <Text style={[styles.filterLabel, { color: theme.colors.onSurface }]}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {allTypes.map(type => (
                <Chip
                  key={type}
                  mode={selectedType === type ? "flat" : "outlined"}
                  onPress={() => setSelectedType(type)}
                  style={styles.filterChip}
                >
                  {type}
                </Chip>
              ))}
            </ScrollView>
          </View>
        </Card.Content>
      </Card>

            {filteredLogs.map((log, index) => {
        const eventDisplay = getEventDisplay(log);
        
        return (
          <Card key={index} style={styles.logCard}>
            <Card.Content>
              <View style={styles.logHeader}>
                <View style={styles.logMeta}>
                  <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                    {eventDisplay.timestamp ? `${formatDate(eventDisplay.timestamp)} ${formatTimestamp(eventDisplay.timestamp)}` : `Event ${index + 1}`}
                  </Text>
                  {eventDisplay.stepKey && (
                    <Text style={[styles.stepKey, { color: theme.colors.onSurfaceVariant }]}>Step: {eventDisplay.stepKey}</Text>
                  )}
                  {eventDisplay.assetKey && (
                    <Text style={[styles.stepKey, { color: theme.colors.onSurfaceVariant }]}>Asset: {eventDisplay.assetKey}</Text>
                  )}
                </View>
                <View style={styles.chipContainer}>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.levelChip, 
                      { borderColor: getLogLevelColor(eventDisplay.level) }
                    ]}
                    textStyle={{ color: getLogLevelColor(eventDisplay.level) }}
                  >
                    {eventDisplay.level}
                  </Chip>
                  <Chip 
                    mode="outlined" 
                    style={styles.typeChip}
                    textStyle={{ color: '#666' }}
                  >
                    {eventDisplay.type}
                  </Chip>
                </View>
              </View>
              <Text style={[styles.logMessage, { color: theme.colors.onSurface }]}>{eventDisplay.message}</Text>
            </Card.Content>
          </Card>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logCount: {
    backgroundColor: '#e3f2fd',
  },
  logCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logMeta: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  stepKey: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  levelChip: {
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeChip: {
    marginLeft: 4,
    backgroundColor: '#f5f5f5',
  },
  logMessage: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  noLogsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  filterContainer: {
    marginVertical: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterChip: {
    marginRight: 8,
  },
});

export default LogsViewer; 