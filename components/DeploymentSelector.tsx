import React from 'react';
import { View, StyleSheet, Alert, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
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
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Loading deployments...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Select Deployment
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={[styles.closeButton, { color: theme.colors.primary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.error }]}>Unable to load deployments</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Using: {currentDeployment}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Deployment
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, { color: theme.colors.primary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {activeDeployments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No deployments found</Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                Using: {currentDeployment}
              </Text>
            </View>
          ) : (
            <FlatList
              data={activeDeployments}
              keyExtractor={(item) => item.deploymentName}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    handleDeploymentSelect(item);
                  }}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: theme.colors.outlineVariant },
                    currentDeployment === item.deploymentName && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                >
                  <Text style={[
                    styles.modalItemText,
                    { color: theme.colors.onSurface },
                    currentDeployment === item.deploymentName && { color: theme.colors.onPrimaryContainer, fontWeight: '600' }
                  ]}>
                    {item.deploymentName}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default DeploymentSelector; 