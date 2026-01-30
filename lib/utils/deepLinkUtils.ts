/**
 * Deep linking utilities for handling Dagster+ URLs
 *
 * Standard URL format: https://[org].dagster.cloud/[deployment]/[type]/[identifier]
 *
 * Examples:
 * - Run: https://hooli.dagster.cloud/data-eng-prod/runs/082e599d-979a-42da-9942-7b45b6254952
 * - Job: https://hooli.dagster.cloud/data-eng-prod/jobs/my_job
 * - Asset: https://hooli.dagster.cloud/data-eng-prod/assets/path/to/asset
 * - Sensor: https://hooli.dagster.cloud/data-eng-prod/sensors/my_sensor
 * - Schedule: https://hooli.dagster.cloud/data-eng-prod/schedules/my_schedule
 */

export interface ParsedDagsterUrl {
  organization?: string;
  deployment?: string;
  type: 'sensor' | 'schedule' | 'job' | 'asset' | 'run' | 'unknown';
  name?: string;
  path?: string[];
  runId?: string;
  valid: boolean;
}

/**
 * Parse a Dagster+ URL into its components
 *
 * Standard format: https://[org].dagster.cloud/[deployment]/[type]/[identifier]
 */
export const parseDagsterUrl = (url: string): ParsedDagsterUrl => {
  try {
    // Remove any trailing slashes and normalize
    const normalizedUrl = url.trim().replace(/\/$/, '');

    // Standard pattern: https://[org].dagster.cloud/[deployment]/[type]/[identifier]
    // Example: https://hooli.dagster.cloud/data-eng-prod/runs/082e599d-979a-42da-9942-7b45b6254952
    const pattern = /https?:\/\/([^.]+)\.dagster\.cloud\/([^/]+)\/(sensors|schedules|jobs|assets|runs)\/(.+)/;
    const match = normalizedUrl.match(pattern);

    if (!match) {
      return { type: 'unknown', valid: false };
    }

    const [, organization, deployment, type, nameOrPath] = match;
    
    // Map URL type to parsed type
    let parsedType: ParsedDagsterUrl['type'] = 'unknown';
    if (type === 'sensors') parsedType = 'sensor';
    else if (type === 'schedules') parsedType = 'schedule';
    else if (type === 'jobs') parsedType = 'job';
    else if (type === 'assets') parsedType = 'asset';
    else if (type === 'runs') parsedType = 'run';

    // For assets, the identifier might be a path (e.g., "path/to/asset")
    if (parsedType === 'asset') {
      const path = nameOrPath.split('/').filter(Boolean);
      return {
        organization,
        deployment,
        type: parsedType,
        path,
        valid: true,
      };
    }

    // For runs, the identifier is the run ID
    if (parsedType === 'run') {
      return {
        organization,
        deployment,
        type: parsedType,
        runId: nameOrPath,
        valid: true,
      };
    }

    // For sensors, schedules, and jobs, the identifier is the name
    return {
      organization,
      deployment,
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
      return {
        tab: 'Automation',
        screen: 'AutomationDetail',
        params: {
          automationName: parsed.name,
          automationType: parsed.type,
        },
      };

    case 'job':
      // Navigate to Jobs tab, then to detail screen
      return {
        tab: 'Jobs',
        screen: 'JobDetail',
        params: {
          jobName: parsed.name,
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

