/**
 * Share utilities for handling shared URLs and clipboard content
 */

import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseDagsterUrl } from './deepLinkUtils';

/**
 * Check if clipboard contains a Dagster URL
 */
export const checkClipboardForDagsterUrl = async (): Promise<string | null> => {
  try {
    const clipboardText = await Clipboard.getStringAsync();
    if (clipboardText && parseDagsterUrl(clipboardText).valid) {
      return clipboardText;
    }
    return null;
  } catch (error) {
    console.error('Error checking clipboard:', error);
    return null;
  }
};

/**
 * Check if a URL is a valid Dagster URL
 */
export const isDagsterUrl = (url: string): boolean => {
  return parseDagsterUrl(url).valid;
};

/**
 * Get current deployment info from stored settings
 */
export const getCurrentDeploymentInfo = async (): Promise<{
  organization?: string;
  deployment?: string;
  workspace?: string;
} | null> => {
  try {
    const apiUrl = await AsyncStorage.getItem('dagster_api_url');
    const workspace = await AsyncStorage.getItem('dagster_workspace');
    
    if (!apiUrl) return null;
    
    // Parse URL: https://[org].dagster.cloud/[deployment]/[workspace]/graphql
    // Or: https://dagster.cloud/[org]/[deployment]/[workspace]/graphql
    const orgMatch = apiUrl.match(/https?:\/\/([^\.\/]+)\.dagster\.cloud/);
    const directMatch = apiUrl.match(/https?:\/\/dagster\.cloud\/([^\/]+)\/([^\/]+)/);
    
    let organization: string | undefined;
    let deployment: string | undefined;
    
    if (orgMatch) {
      // Subdomain format: org.dagster.cloud
      organization = orgMatch[1];
      const deploymentMatch = apiUrl.match(/https?:\/\/[^\/]+\/([^\/]+)\//);
      deployment = deploymentMatch?.[1];
    } else if (directMatch) {
      // Direct format: dagster.cloud/org/deployment
      organization = directMatch[1];
      deployment = directMatch[2];
    }
    
    return {
      organization,
      deployment,
      workspace: workspace || undefined,
    };
  } catch (error) {
    console.error('Error getting deployment info:', error);
    return null;
  }
};

/**
 * Generate a Dagster+ web URL for sharing
 */
export const generateDagsterUrl = async (
  type: 'job' | 'asset' | 'run' | 'sensor' | 'schedule',
  identifier: string | string[],
  repositoryLocationName?: string,
  repositoryName?: string
): Promise<string | null> => {
  try {
    const deploymentInfo = await getCurrentDeploymentInfo();
    
    if (!deploymentInfo?.organization || !deploymentInfo?.deployment) {
      console.warn('Cannot generate URL: missing organization or deployment');
      return null;
    }
    
    const org = deploymentInfo.organization;
    const deployment = deploymentInfo.deployment;
    const workspace = repositoryName || deploymentInfo.workspace || '__repository__';
    
    // Handle workspace format: __repository__@location_name
    // If repositoryLocationName is provided and workspace doesn't already include @, append it
    let workspacePath = workspace;
    if (repositoryLocationName && !workspace.includes('@')) {
      workspacePath = `${workspace}@${repositoryLocationName}`;
    } else if (!repositoryLocationName && workspace.includes('@')) {
      // If workspace already has @ but we don't have repositoryLocationName, use as-is
      workspacePath = workspace;
    }
    
    let path = '';
    
    switch (type) {
      case 'job':
        path = `jobs/${encodeURIComponent(identifier as string)}`;
        break;
      case 'asset':
        const assetPath = Array.isArray(identifier) ? identifier : [identifier];
        path = `assets/${assetPath.map(seg => encodeURIComponent(seg)).join('/')}`;
        break;
      case 'run':
        path = `runs/${encodeURIComponent(identifier as string)}`;
        break;
      case 'sensor':
        path = `sensors/${encodeURIComponent(identifier as string)}`;
        break;
      case 'schedule':
        path = `schedules/${encodeURIComponent(identifier as string)}`;
        break;
    }
    
    return `https://${org}.dagster.cloud/${deployment}/workspace/${workspacePath}/${path}`;
  } catch (error) {
    console.error('Error generating Dagster URL:', error);
    return null;
  }
};

