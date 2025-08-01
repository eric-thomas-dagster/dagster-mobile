import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert, Switch } from 'react-native';
import { Card, Title, Paragraph, ActivityIndicator, Text, Searchbar, SegmentedButtons, Button } from 'react-native-paper';
import { useQuery, useLazyQuery, useMutation, useApolloClient } from '@apollo/client';
import { GET_SCHEDULES, GET_SENSORS, GET_REPOSITORIES, START_SENSOR, STOP_SENSOR, START_SCHEDULE, STOP_SCHEDULE } from '../../lib/graphql/queries';
import { ScheduleResult, SensorResult, RepositorySelector, Repository, SensorSelector, ScheduleSelector } from '../../lib/types/dagster';
import { useTheme } from '../ThemeProvider';
import Svg, { Path } from 'react-native-svg';

interface AutomationsScreenProps {
  navigation: any;
  route: any;
}

const AutomationsScreen: React.FC<AutomationsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'sensors' | 'schedules'>('sensors');
  const client = useApolloClient();
  
  // Fetch all repositories
  const { data: repositoriesData, loading: repositoriesLoading, refetch: refetchRepositories, error: repositoriesError } = useQuery(GET_REPOSITORIES, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });
  
  // State to store all automations grouped by repository
  const [automationsByRepository, setAutomationsByRepository] = React.useState<{[key: string]: any[]}>({});
  const [loadingAutomations, setLoadingAutomations] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Get repositories data
  const repositories = repositoriesData?.repositoriesOrError?.nodes || [];

  // Lazy queries for schedules and sensors
  const [getSchedules, { loading: schedulesLoading }] = useLazyQuery(GET_SCHEDULES, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });
  
  const [getSensors, { loading: sensorsLoading }] = useLazyQuery(GET_SENSORS, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Always fetch from network, never use cache
  });

  // Mutations for enabling/disabling automations
  const [startSensor] = useMutation(START_SENSOR, {
    errorPolicy: 'all',
  });
  
  const [stopSensor] = useMutation(STOP_SENSOR, {
    errorPolicy: 'all',
  });
  
  const [startSchedule] = useMutation(START_SCHEDULE, {
    errorPolicy: 'all',
  });
  
  const [stopSchedule] = useMutation(STOP_SCHEDULE, {
    errorPolicy: 'all',
  });

  // Fetch automations for each repository when repositories change
  React.useEffect(() => {
    console.log('AutomationsScreen - useEffect triggered, repositories length:', repositories.length);
    console.log('AutomationsScreen - Repositories found:', repositories.map((r: Repository) => r.name));
    console.log('AutomationsScreen - Full repository data:', repositories);
    
    if (repositories.length > 0) {
      console.log('AutomationsScreen - Setting loading to true and fetching automations...');
      setLoadingAutomations(true);
      
      const fetchAutomationsForRepository = async (repo: Repository) => {
        try {
          const repoName = repo.location?.name || repo.name || `repo_${repo.id}`;
          // Use the repository name and location name from the repository data
          const repositorySelector: RepositorySelector = {
            repositoryLocationName: repo.location?.name || "default",
            repositoryName: repo.name
          };

          console.log(`AutomationsScreen - Fetching automations for ${repoName}`);
          console.log(`AutomationsScreen - Repository selector:`, repositorySelector);
          console.log(`AutomationsScreen - Original repo data:`, repo);
          console.log(`AutomationsScreen - Repo location:`, repo.location);
          console.log(`AutomationsScreen - Repo name:`, repo.name);

          // Fetch schedules and sensors for this repository
          const [schedulesResult, sensorsResult] = await Promise.all([
            getSchedules({ variables: { repositorySelector } }),
            getSensors({ variables: { repositorySelector } })
          ]);

          console.log(`AutomationsScreen - ${repoName} schedules result:`, schedulesResult);
          console.log(`AutomationsScreen - ${repoName} sensors result:`, sensorsResult);
          
          if (schedulesResult.error) {
            console.log(`AutomationsScreen - ${repoName} schedules error:`, schedulesResult.error);
          }
          if (sensorsResult.error) {
            console.log(`AutomationsScreen - ${repoName} sensors error:`, sensorsResult.error);
          }
          
          // Log the actual data structure to see what fields are available
          if (schedulesResult.data) {
            console.log(`AutomationsScreen - ${repoName} schedules data structure:`, schedulesResult.data);
          }
          if (sensorsResult.data) {
            console.log(`AutomationsScreen - ${repoName} sensors data structure:`, sensorsResult.data);
          }

          const schedules = schedulesResult.data?.schedulesOrError?.results || [];
          const sensors = sensorsResult.data?.sensorsOrError?.results || [];

          console.log(`AutomationsScreen - ${repoName} schedules:`, schedules.length);
          console.log(`AutomationsScreen - ${repoName} sensors:`, sensors.length);

          // Transform schedules
          const transformedSchedules = schedules.map((schedule: ScheduleResult) => {
            console.log(`AutomationsScreen - Schedule ${schedule.name} status:`, schedule.scheduleState.status);
            return {
              id: schedule.id,
              name: schedule.name,
              status: schedule.scheduleState.status,
              type: 'schedule' as const,
              description: schedule.cronSchedule ? `Cron: ${schedule.cronSchedule}` : 'Schedule',
              repositoryName: repo.name,
              repositoryLocationName: repo.location?.name || "default",
            };
          });

          // Transform sensors
          const transformedSensors = sensors.map((sensor: SensorResult) => {
            console.log(`AutomationsScreen - Sensor ${sensor.name} status:`, sensor.sensorState.status);
            return {
              id: sensor.id,
              name: sensor.name,
              status: sensor.sensorState.status,
              type: 'sensor' as const,
              description: `Targets: ${sensor.targets.length} pipeline${sensor.targets.length !== 1 ? 's' : ''}`,
              repositoryName: repo.name,
              repositoryLocationName: repo.location?.name || "default",
            };
          });

          const allAutomations = [...transformedSchedules, ...transformedSensors];
          
          return {
            repositoryName: repoName,
            automations: allAutomations
          };
        } catch (error) {
          console.error('Error fetching automations for repository:', repo.name, error);
          return {
            repositoryName: repo.location?.name || repo.name,
            automations: []
          };
        }
      };

      // Process all repositories
      Promise.all(repositories.map(fetchAutomationsForRepository))
        .then((results) => {
          const automationsMap: {[key: string]: any[]} = {};
          results.forEach(({ repositoryName, automations }) => {
            console.log(`AutomationsScreen - Repository ${repositoryName}: ${automations.length} automations`);
            if (automations.length > 0) {
              automations.forEach((automation: any) => {
                console.log(`AutomationsScreen - ${automation.name} (${automation.type}) status:`, automation.status);
              });
              automationsMap[repositoryName] = automations;
            }
          });
          console.log('AutomationsScreen - Final automations map:', Object.keys(automationsMap));
          setAutomationsByRepository(automationsMap);
          console.log('AutomationsScreen - Setting loading to false');
          setLoadingAutomations(false);
        })
        .catch(() => {
          console.log('AutomationsScreen - Error occurred, setting loading to false');
          setLoadingAutomations(false);
        });
          }
    }, [repositories, refreshTrigger]);

  const onRefresh = React.useCallback(async () => {
    console.log('AutomationsScreen - Starting refresh...');
    setRefreshing(true);
    
    // Reset automations state to force fresh data
    setAutomationsByRepository({});
    setLoadingAutomations(true);
    
    // Clear Apollo cache to force fresh data
    await client.clearStore();
    console.log('AutomationsScreen - Apollo cache cleared');
    
    // Force refetch with network-only policy and wait for it to complete
    const result = await refetchRepositories({ fetchPolicy: 'network-only' });
    console.log('AutomationsScreen - Refetch result:', result);
    console.log('AutomationsScreen - Refresh completed');
    setRefreshing(false);
    
    // Safety timeout to reset loading state if useEffect doesn't trigger
    setTimeout(() => {
      console.log('AutomationsScreen - Safety timeout: setting loading to false');
      setLoadingAutomations(false);
    }, 10000); // 10 second timeout
    
    // Force trigger the useEffect by updating refresh trigger
    setTimeout(() => {
      console.log('AutomationsScreen - Force triggering useEffect...');
      setRefreshTrigger(prev => prev + 1);
    }, 1000);
  }, [refetchRepositories, client]);



  const handleToggleAutomation = async (automation: any, newValue: boolean) => {
    console.log('AutomationsScreen - Toggle automation:', automation.name, 'to:', newValue, 'current status:', automation.status);
    try {
      if (automation.type === 'sensor') {
        const result = newValue 
          ? await startSensor({ variables: { sensorSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            sensorName: automation.name,
          } } })
          : await stopSensor({ variables: { id: automation.id } });
        
        console.log('Sensor toggle result:', result);
        
        // Check for successful response
        const sensorState = result.data?.startSensor?.sensorState;
        const instigationState = result.data?.stopSensor?.instigationState;
        if (sensorState || instigationState) {
          console.log('Sensor mutation successful, updating optimistically...');
          
          // For sensors, we get the actual status back, so we can update optimistically
          const updatedAutomationsByRepository = { ...automationsByRepository };
          const repoName = Object.keys(updatedAutomationsByRepository).find(repo => 
            updatedAutomationsByRepository[repo].some(a => a.id === automation.id)
          );
          
          if (repoName) {
            const automationIndex = updatedAutomationsByRepository[repoName].findIndex(a => a.id === automation.id);
            if (automationIndex !== -1) {
              // Use the actual status from the response if available
              const actualStatus = sensorState?.status || instigationState?.status || (newValue ? 'RUNNING' : 'STOPPED');
              updatedAutomationsByRepository[repoName][automationIndex].status = actualStatus;
              setAutomationsByRepository(updatedAutomationsByRepository);
            }
          }
          
          Alert.alert('Success', `Sensor ${newValue ? 'started' : 'stopped'} successfully!`);
          // Reset state and clear cache to get fresh data
          setAutomationsByRepository({});
          await client.clearStore();
          setTimeout(() => onRefresh(), 500);
        } else if (result.errors) {
          Alert.alert('Error', result.errors[0]?.message || `Failed to ${newValue ? 'start' : 'stop'} sensor`);
        }
      } else if (automation.type === 'schedule') {
        const result = newValue 
          ? await startSchedule({ variables: { scheduleSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            scheduleName: automation.name,
          } } })
          : await stopSchedule({ variables: { scheduleSelector: {
            repositoryName: automation.repositoryName,
            repositoryLocationName: automation.repositoryLocationName,
            scheduleName: automation.name,
          } } });
        
        console.log('Schedule toggle result:', result);
        
        // Check for successful response
        const scheduleResult = result.data?.startSchedule || result.data?.resetSchedule;
        if (scheduleResult && scheduleResult.__typename === 'ScheduleMutationResult') {
          console.log('Schedule mutation successful, refreshing data...');
          
          // Don't update optimistically since we don't know the actual status
          // Just refresh the data immediately to get the real status
          Alert.alert('Success', `Schedule ${newValue ? 'started' : 'stopped'} successfully!`);
          // Reset state and clear cache to get fresh data
          setAutomationsByRepository({});
          await client.clearStore();
          onRefresh();
        } else if (result.errors) {
          Alert.alert('Error', result.errors[0]?.message || `Failed to ${newValue ? 'start' : 'stop'} schedule`);
        }
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
      Alert.alert('Error', 'Failed to toggle automation');
    }
  };

  // Filter automations based on view mode and search
  console.log('AutomationsScreen - Filtering automations. View mode:', viewMode, 'Search:', searchQuery);
  console.log('AutomationsScreen - Available automations:', Object.keys(automationsByRepository));
  
  const filteredAutomationsByRepository = Object.keys(automationsByRepository).reduce((acc, repoName) => {
    const automations = automationsByRepository[repoName].filter(item => {
      const matchesViewMode = viewMode === 'sensors' ? item.type === 'sensor' : item.type === 'schedule';
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesViewMode && matchesSearch;
    });
    
    if (automations.length > 0) {
      acc[repoName] = automations;
    }
    
    return acc;
  }, {} as {[key: string]: any[]});
  
  console.log('AutomationsScreen - Filtered automations:', Object.keys(filteredAutomationsByRepository));



  // Repository Icon Component
  const RepositoryIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.667 5.00004H10.0003L8.33366 3.33337H3.33366C2.41699 3.33337 1.67533 4.08337 1.67533 5.00004L1.66699 15C1.66699 15.9167 2.41699 16.6667 3.33366 16.6667H16.667C17.5837 16.6667 18.3337 15.9167 18.3337 15V6.66671C18.3337 5.75004 17.5837 5.00004 16.667 5.00004ZM16.667 15H3.33366V6.66671H16.667V15Z"
        fill={color}
      />
    </Svg>
  );

  const loading = repositoriesLoading || loadingAutomations || schedulesLoading || sensorsLoading;
  
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading automations...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
        <Searchbar
          placeholder={`Search ${viewMode}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: 'sensors', label: 'Sensors' },
            { value: 'schedules', label: 'Schedules' }
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={Object.keys(filteredAutomationsByRepository)}
        renderItem={({ item: repoName }) => (
          <View style={styles.repositorySection}>
            <View style={styles.repositoryHeader}>
              <RepositoryIcon color={theme.colors.onSurface} size={20} />
              <Text style={[styles.repositoryName, { color: theme.colors.onSurface }]}>{repoName}</Text>
            </View>
            {filteredAutomationsByRepository[repoName].map((automation) => (
              <TouchableOpacity
                key={automation.id}
                onPress={() => navigation.navigate('AutomationDetail', { automation })}
                style={styles.cardTouchable}
              >
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.itemHeader}>
                      <Title style={styles.itemName}>{automation.name}</Title>
                    </View>
                    {automation.description && (
                      <Paragraph style={[styles.itemDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {automation.description}
                      </Paragraph>
                    )}
                    <View style={styles.toggleContainer}>
                      <Text style={[styles.toggleLabel, { color: theme.colors.onSurfaceVariant }]}>
                        {automation.status === 'RUNNING' ? 'Running' : 'Stopped'}
                      </Text>
                      <Switch
                        value={automation.status === 'RUNNING'}
                        onValueChange={(newValue) => handleToggleAutomation(automation, newValue)}
                        trackColor={{ false: '#767577', true: '#4caf50' }}
                        thumbColor={automation.status === 'RUNNING' ? '#ffffff' : '#f4f3f4'}
                      />
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
        keyExtractor={(repoName) => repoName}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No {viewMode} found</Text>
            <Text style={styles.emptySubtext}>
              {viewMode === 'sensors' 
                ? 'Sensors monitor external events and trigger jobs'
                : 'Schedules run jobs at specified intervals'
              }
            </Text>
            {repositoriesError && (
              <Text style={styles.errorText}>
                Error loading repositories.
              </Text>
            )}
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
  header: {
    padding: 16,
    elevation: 2,
  },
  searchBar: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 8,
  },
  repositorySection: {
    marginBottom: 24,
  },
  repositoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  repositoryName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    marginLeft: 8,
  },
  enableButton: {
    backgroundColor: '#4caf50',
  },
  disableButton: {
    borderColor: '#f44336',
  },
  buttonLabel: {
    fontSize: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  toggleLabel: {
    fontSize: 14,
  },
  cardTouchable: {
    marginBottom: 16,
  },
});

export default AutomationsScreen; 