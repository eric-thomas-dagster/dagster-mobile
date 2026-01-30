import { ApolloClient } from '@apollo/client';
import { AlertRule, AlertEvaluationResult } from '../types/alerts';
import { GET_RUNS } from '../graphql/queries';

/**
 * Evaluates a single alert rule against current data
 */
export const evaluateAlert = async (
  alert: AlertRule,
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<AlertEvaluationResult> => {
  try {
    switch (alert.type) {
      case 'JOB_FAILURE':
        return await evaluateJobFailure(alert, apolloClient, sinceTimestamp);

      case 'JOB_SUCCESS':
        return await evaluateJobSuccess(alert, apolloClient, sinceTimestamp);

      case 'ANY_JOB_FAILURE':
        return await evaluateAnyJobFailure(apolloClient, sinceTimestamp);

      case 'ASSET_FAILURE':
        return await evaluateAssetFailure(alert, apolloClient, sinceTimestamp);

      default:
        return {
          shouldTrigger: false,
          message: 'Unknown alert type',
        };
    }
  } catch (error) {
    console.error('Error evaluating alert:', error);
    return {
      shouldTrigger: false,
      message: 'Error evaluating alert',
    };
  }
};

/**
 * Check if a specific job has failed
 */
const evaluateJobFailure = async (
  alert: AlertRule,
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<AlertEvaluationResult> => {
  const { data } = await apolloClient.query({
    query: GET_RUNS,
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  if (!data?.runsOrError?.results) {
    return { shouldTrigger: false, message: 'No runs found' };
  }

  const runs = data.runsOrError.results;

  // Find failed runs for this specific job since last check
  const failedRuns = runs.filter((run: any) => {
    const matchesJob = run.pipelineName === alert.targetId;
    const isFailure = run.status === 'FAILURE';
    const isRecent = run.startTime ? parseFloat(run.startTime) >= sinceTimestamp / 1000 : false;
    const notAlreadyTriggered = run.id !== alert.lastTriggeredRunId;

    return matchesJob && isFailure && isRecent && notAlreadyTriggered;
  });

  if (failedRuns.length > 0) {
    const latestFailure = failedRuns[0];
    return {
      shouldTrigger: true,
      runId: latestFailure.id,
      message: `Job "${alert.targetName || alert.targetId}" failed`,
    };
  }

  return { shouldTrigger: false, message: 'No failures detected' };
};

/**
 * Check if a specific job has succeeded
 */
const evaluateJobSuccess = async (
  alert: AlertRule,
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<AlertEvaluationResult> => {
  const { data } = await apolloClient.query({
    query: GET_RUNS,
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  if (!data?.runsOrError?.results) {
    return { shouldTrigger: false, message: 'No runs found' };
  }

  const runs = data.runsOrError.results;

  const successRuns = runs.filter((run: any) => {
    const matchesJob = run.pipelineName === alert.targetId;
    const isSuccess = run.status === 'SUCCESS';
    const isRecent = run.startTime ? parseFloat(run.startTime) >= sinceTimestamp / 1000 : false;
    const notAlreadyTriggered = run.id !== alert.lastTriggeredRunId;

    return matchesJob && isSuccess && isRecent && notAlreadyTriggered;
  });

  if (successRuns.length > 0) {
    const latestSuccess = successRuns[0];
    return {
      shouldTrigger: true,
      runId: latestSuccess.id,
      message: `Job "${alert.targetName || alert.targetId}" completed successfully`,
    };
  }

  return { shouldTrigger: false, message: 'No successes detected' };
};

/**
 * Check if any job has failed
 */
const evaluateAnyJobFailure = async (
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<AlertEvaluationResult> => {
  const { data } = await apolloClient.query({
    query: GET_RUNS,
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  if (!data?.runsOrError?.results) {
    return { shouldTrigger: false, message: 'No runs found' };
  }

  const runs = data.runsOrError.results;

  const failedRuns = runs.filter((run: any) => {
    const isFailure = run.status === 'FAILURE';
    const isRecent = run.startTime ? parseFloat(run.startTime) >= sinceTimestamp / 1000 : false;
    return isFailure && isRecent;
  });

  if (failedRuns.length > 0) {
    const latestFailure = failedRuns[0];
    return {
      shouldTrigger: true,
      runId: latestFailure.id,
      message: `Job "${latestFailure.pipelineName}" failed`,
    };
  }

  return { shouldTrigger: false, message: 'No failures detected' };
};

/**
 * Check if a specific asset materialization has failed
 */
const evaluateAssetFailure = async (
  alert: AlertRule,
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<AlertEvaluationResult> => {
  // For now, we'll check for failed runs that might have been materializing this asset
  // This is a simplified implementation - could be enhanced with specific asset queries
  const { data } = await apolloClient.query({
    query: GET_RUNS,
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
  });

  if (!data?.runsOrError?.results) {
    return { shouldTrigger: false, message: 'No runs found' };
  }

  const runs = data.runsOrError.results;

  // Look for failed asset job runs
  const failedAssetRuns = runs.filter((run: any) => {
    const isAssetJob = run.pipelineName === '__ASSET_JOB';
    const isFailure = run.status === 'FAILURE';
    const isRecent = run.startTime ? parseFloat(run.startTime) >= sinceTimestamp / 1000 : false;
    const notAlreadyTriggered = run.id !== alert.lastTriggeredRunId;

    return isAssetJob && isFailure && isRecent && notAlreadyTriggered;
  });

  if (failedAssetRuns.length > 0) {
    const latestFailure = failedAssetRuns[0];
    return {
      shouldTrigger: true,
      runId: latestFailure.id,
      message: `Asset "${alert.targetName || alert.targetId}" materialization failed`,
    };
  }

  return { shouldTrigger: false, message: 'No failures detected' };
};

/**
 * Evaluates all enabled alerts
 */
export const evaluateAllAlerts = async (
  alerts: AlertRule[],
  apolloClient: ApolloClient<any>,
  sinceTimestamp: number
): Promise<Map<string, AlertEvaluationResult>> => {
  const results = new Map<string, AlertEvaluationResult>();

  const enabledAlerts = alerts.filter(a => a.enabled);

  for (const alert of enabledAlerts) {
    const result = await evaluateAlert(alert, apolloClient, sinceTimestamp);
    results.set(alert.id, result);
  }

  return results;
};
