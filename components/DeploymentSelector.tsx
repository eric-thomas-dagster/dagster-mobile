import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Card, Title, Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { useQuery } from '@apollo/client';
import { GET_DEPLOYMENTS } from '../lib/graphql/queries';
import { DagsterCloudDeployment } from '../lib/types/dagster';
import { useTheme } from './ThemeProvider';

interface DeploymentSelectorProps {
  currentDeployment: string;
  onDeploymentChange: (deployment: DagsterCloudDeployment) => void;
  onClose: () => void;
}

const DeploymentSelector: React.FC<DeploymentSelectorProps> = ({
  currentDeployment,
  onDeploymentChange,
  onClose
}) => {
  const { theme } = useTheme();
  const { data, loading, error } = useQuery(GET_DEPLOYMENTS, {
    errorPolicy: 'all',
  });

  // Debug logging
  React.useEffect(() => {
    console.log('DeploymentSelector - Data:', data);
    console.log('DeploymentSelector - Error:', error);
    if (data) {
      console.log('DeploymentSelector - Deployments:', data.deployments);
      console.log('DeploymentSelector - All data keys:', Object.keys(data));
      console.log('DeploymentSelector - Total deployments:', data.deployments?.length || 0);
      
      // Additional filtering debug info
      if (data.deployments && data.deployments.length > 0) {
        console.log('DeploymentSelector - All deployment names:', data.deployments.map((d: DagsterCloudDeployment) => d.deploymentName));
      }
    }
  }, [data, error]);

  const handleDeploymentSelect = (deployment: DagsterCloudDeployment) => {
    Alert.alert(
      'Switch Deployment',
      `Switch to ${deployment.deploymentName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: () => {
            onDeploymentChange(deployment);
            onClose();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading deployments...</Text>
      </View>
    );
  }

  if (error) {
      return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={{ color: theme.colors.onSurface }}>Select Deployment</Title>
            <Button mode="text" onPress={onClose}>
              Close
            </Button>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Enter your deployment details manually:
          </Text>

            <View style={styles.manualInput}>
              <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>Organization:</Text>
              <Text style={[styles.inputExample, { color: theme.colors.onSurfaceVariant }]}>e.g., hooli</Text>
              
              <Text style={[styles.inputLabel, { color: theme.colors.onSurface }]}>Deployment:</Text>
              <Text style={[styles.inputExample, { color: theme.colors.onSurfaceVariant }]}>e.g., data-eng-prod</Text>
              
              <Text style={[styles.inputSubtext, { color: theme.colors.onSurfaceVariant }]}>
                Your GraphQL URL will be: https://{'{org}'}.dagster.cloud/{'{deployment}'}/graphql
              </Text>
            </View>

            <Button 
              mode="contained" 
              onPress={onClose}
              style={styles.manualButton}
            >
              Configure in Settings
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const deployments = data?.deployments || [];
  
  // Filter for only active deployments
  const activeDeployments = deployments.filter((deployment: DagsterCloudDeployment) => {
    const deploymentName = deployment.deploymentName;
    
    // Filter out GUID-like deployment names (long hexadecimal strings)
    // These are typically deleted or temporary deployments
    const guidPattern = /^[a-f0-9]{32,}$/i; // 32+ character hex string
    const isGuid = guidPattern.test(deploymentName);
    
    return !isGuid;
  });



  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={{ color: theme.colors.onSurface }}>Select Deployment</Title>
            <Button mode="text" onPress={onClose}>
              Close
            </Button>
          </View>
          
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Choose a deployment to connect to:
          </Text>

          {activeDeployments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No deployments found</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Make sure your API token has access to multiple deployments.
              </Text>
              <View style={[styles.currentDeploymentInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.currentDeploymentTitle, { color: theme.colors.onSurface }]}>Current Deployment:</Text>
                <Text style={[styles.currentDeploymentText, { color: theme.colors.primary }]}>{currentDeployment}</Text>
                <Text style={[styles.currentDeploymentSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  Configure additional deployments in Settings
                </Text>
              </View>
            </View>
          ) : (
            <ScrollView 
              style={styles.deploymentsScrollView}
              contentContainerStyle={styles.deploymentsList}
              showsVerticalScrollIndicator={true}
            >
              {activeDeployments.map((deployment: DagsterCloudDeployment) => (
                <Card
                  key={deployment.deploymentName}
                  style={[
                    styles.deploymentCard,
                    currentDeployment === deployment.deploymentName && [styles.selectedCard, { borderColor: theme.colors.primary }]
                  ]}
                  onPress={() => handleDeploymentSelect(deployment)}
                >
                  <Card.Content>
                    <View style={styles.deploymentHeader}>
                      <Title style={[styles.deploymentName, { color: theme.colors.onSurface }]}>
                        {deployment.deploymentName}
                      </Title>
                      {currentDeployment === deployment.deploymentName && (
                        <Chip
                          mode="flat"
                          style={[styles.currentChip, { backgroundColor: theme.colors.primary }]}
                          textStyle={{ color: '#ffffff' }}
                        >
                          Current
                        </Chip>
                      )}
                    </View>
                    <Text style={[styles.deploymentDetails, { color: theme.colors.onSurfaceVariant }]}>
                      {deployment.organizationName} / {deployment.deploymentName}
                    </Text>
                    <Text style={[styles.deploymentUrl, { color: theme.colors.onSurfaceVariant }]}>
                      https://{deployment.organizationName}.dagster.cloud/{deployment.deploymentName}/graphql
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 8,
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
  deploymentsScrollView: {
    maxHeight: 400,
  },
  deploymentsList: {
    gap: 12,
    paddingBottom: 100,
  },
  deploymentCard: {
    marginBottom: 8,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
  },
  deploymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deploymentName: {
    fontSize: 16,
    flex: 1,
  },
  currentChip: {
  },
  deploymentDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  deploymentUrl: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  manualInput: {
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  inputExample: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  inputSubtext: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  manualButton: {
    marginTop: 16,
  },
  currentDeploymentInfo: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  currentDeploymentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentDeploymentText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentDeploymentSubtext: {
    fontSize: 12,
  },
});

export default DeploymentSelector; 