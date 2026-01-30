/**
 * Deep linking utilities for handling Dagster+ URLs
 * 
 * URL patterns:
 * - Sensor: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/sensors/[sensor_name]
 * - Schedule: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/schedules/[schedule_name]
 * - Job: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/jobs/[job_name]
 * - Asset: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/assets/[asset_path]
 * - Run: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/runs/[run_id]
 */

export interface ParsedDagsterUrl {
  organization?: string;
  deployment?: string;
  workspace?: string;
  type: 'sensor' | 'schedule' | 'job' | 'asset' | 'run' | 'unknown';
  name?: string;
  path?: string[];
  runId?: string;
  valid: boolean;
}

/**
 * Parse a Dagster+ URL into its components
 * 
 * Supports two URL formats:
 * 1. https://[org].dagster.cloud/[deployment]/workspace/[workspace]/[type]/[name]
 * 2. https://dagster.cloud/[org]/[deployment]/workspace/[workspace]/[type]/[name]
 */
export const parseDagsterUrl = (url: string): ParsedDagsterUrl => {
  try {
    // Remove any trailing slashes and normalize
    const normalizedUrl = url.trim().replace(/\/$/, '');
    
    // Pattern 1: https://[org].dagster.cloud/[deployment]/workspace/[workspace]/[type]/[name]
    // Example: https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name
    const subdomainPattern = /https?:\/\/([^\/]+)\.dagster\.cloud\/([^\/]+)\/workspace\/([^\/]+)\/(sensors|schedules|jobs|assets|runs)\/(.+)/;
    let match = normalizedUrl.match(subdomainPattern);
    
    let organization: string | undefined;
    let deployment: string | undefined;
    let workspace: string | undefined;
    let type: string | undefined;
    let nameOrPath: string | undefined;
    
    if (match) {
      // Subdomain format: org.dagster.cloud
      [, organization, deployment, workspace, type, nameOrPath] = match;
    } else {
      // Pattern 2: https://dagster.cloud/[org]/[deployment]/workspace/[workspace]/[type]/[name]
      // Example: https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name
      const directPattern = /https?:\/\/dagster\.cloud\/([^\/]+)\/([^\/]+)\/workspace\/([^\/]+)\/(sensors|schedules|jobs|assets|runs)\/(.+)/;
      match = normalizedUrl.match(directPattern);
      
      if (match) {
        // Direct format: dagster.cloud/org/deployment
        [, organization, deployment, workspace, type, nameOrPath] = match;
      } else {
        // Pattern 3: https://dagster.cloud/[org]/[deployment]/[type]/[name] (without workspace)
        // Example: https://dagster.cloud/hooli/data-eng-prod/sensors/sensor_name
        const noWorkspacePattern = /https?:\/\/dagster\.cloud\/([^\/]+)\/([^\/]+)\/(sensors|schedules|jobs|assets|runs)\/(.+)/;
        match = normalizedUrl.match(noWorkspacePattern);
        
        if (match) {
          // Format: dagster.cloud/org/deployment/type/name (no workspace)
          [, organization, deployment, type, nameOrPath] = match;
          workspace = '__repository__'; // Default workspace
        } else {
          return { type: 'unknown', valid: false };
        }
      }
    }
    
    if (!match || !organization || !deployment || !workspace || !type || !nameOrPath) {
      return { type: 'unknown', valid: false };
    }
    
    // Handle workspace format: __repository__@location_name
    const workspaceParts = workspace.split('@');
    const repositoryName = workspaceParts[0];
    const locationName = workspaceParts[1] || '';
    
    // Determine the type
    let parsedType: ParsedDagsterUrl['type'] = 'unknown';
    if (type === 'sensors') parsedType = 'sensor';
    else if (type === 'schedules') parsedType = 'schedule';
    else if (type === 'jobs') parsedType = 'job';
    else if (type === 'assets') parsedType = 'asset';
    else if (type === 'runs') parsedType = 'run';
    
    // For assets, the name might be a path (e.g., "path/to/asset")
    if (parsedType === 'asset') {
      const path = nameOrPath.split('/').filter(Boolean);
      return {
        organization,
        deployment,
        workspace: repositoryName,
        type: parsedType,
        path,
        valid: true,
      };
    }
    
    // For runs, the name is the run ID
    if (parsedType === 'run') {
      return {
        organization,
        deployment,
        workspace: repositoryName,
        type: parsedType,
        runId: nameOrPath,
        valid: true,
      };
    }
    
    // For sensors, schedules, and jobs, the name is the identifier
    return {
      organization,
      deployment,
      workspace: repositoryName,
      type: parsedType,
      name: nameOrPath,
      valid: true,
    };
  } catch (error) {
    console.error('Error parsing Dagster URL:', error);
    return { type: 'unknown', valid: false };
  }
};

/**
 * Get navigation params for a parsed URL
 */
export const getNavigationParams = (parsed: ParsedDagsterUrl) => {
  if (!parsed.valid) return null;
  
  switch (parsed.type) {
    case 'sensor':
    case 'schedule':
      // Navigate to Automation tab, then to detail screen
      // Note: AutomationDetailScreen expects an automation object, but we'll pass the name
      // and let the screen handle finding it
      return {
        tab: 'Automation',
        screen: 'AutomationDetail',
        params: {
          automationName: parsed.name,
          automationType: parsed.type,
          repositoryLocationName: parsed.workspace?.split('@')[1] || '',
          repositoryName: parsed.workspace || '__repository__',
        },
      };
    
    case 'job':
      // Navigate to Jobs tab, then to detail screen
      // We'll pass the job name and let the screen find the job ID
      return {
        tab: 'Jobs',
        screen: 'JobDetail',
        params: {
          jobName: parsed.name,
          repositoryLocationName: parsed.workspace?.split('@')[1] || '',
          repositoryName: parsed.workspace || '__repository__',
        },
      };
    
    case 'asset':
      // Navigate to Catalog tab, then to asset detail
      return {
        tab: 'Catalog',
        screen: 'AssetDetail',
        params: {
          assetKey: {
            path: parsed.path || [],
          },
        },
      };
    
    case 'run':
      // Navigate to Runs tab, then to run detail
      return {
        tab: 'Runs',
        screen: 'RunDetail',
        params: {
          runId: parsed.runId,
        },
      };
    
    default:
      return null;
  }
};

