import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  loadAlerts,
  updateAlert,
  loadLastCheckTime,
  saveLastCheckTime,
} from './alertStorage';
import { evaluateAllAlerts } from './alertEvaluation';
import { sendAlertNotification, updateBadgeCount, getUnreadCount } from './notificationUtils';
import { getApolloClient } from '../apollo-client';

const BACKGROUND_TASK_NAME = 'DAGSTER_ALERTS_BACKGROUND_TASK';

// Register the background task
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    console.log('[BackgroundAlerts] Running background task');

    // Get Apollo client
    const apolloClient = getApolloClient();
    if (!apolloClient) {
      console.error('[BackgroundAlerts] Apollo client not available');
      return BackgroundTask.BackgroundTaskResult.Failed;
    }

    // Load all alerts
    const alerts = await loadAlerts();
    const enabledAlerts = alerts.filter((a) => a.enabled);

    if (enabledAlerts.length === 0) {
      console.log('[BackgroundAlerts] No enabled alerts');
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // Get last check time
    const lastCheckTime = await loadLastCheckTime();
    console.log(
      `[BackgroundAlerts] Checking alerts since ${new Date(lastCheckTime).toISOString()}`
    );

    // Evaluate all alerts
    const results = await evaluateAllAlerts(enabledAlerts, apolloClient, lastCheckTime);

    // Process results and send notifications
    let notificationsSent = 0;
    for (const alert of enabledAlerts) {
      const result = results.get(alert.id);
      if (result?.shouldTrigger) {
        console.log(`[BackgroundAlerts] Alert triggered: ${alert.name}`);

        // Send notification
        await sendAlertNotification(alert, result);
        notificationsSent++;

        // Update alert with last triggered info
        await updateAlert(alert.id, {
          lastTriggered: Date.now(),
          lastTriggeredRunId: result.runId,
        });
      }

      // Update last checked timestamp
      await updateAlert(alert.id, {
        lastChecked: Date.now(),
      });
    }

    // Update last check time
    await saveLastCheckTime(Date.now());

    // Update badge count
    const unreadCount = await getUnreadCount();
    await updateBadgeCount(unreadCount);

    console.log(
      `[BackgroundAlerts] Background task completed. Sent ${notificationsSent} notifications.`
    );

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('[BackgroundAlerts] Error in background task:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Register background task
 * Call this once during app initialization
 */
export const registerBackgroundFetch = async (): Promise<void> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      console.log('[BackgroundAlerts] Background task already registered');
      return;
    }

    // Register the background task
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed on iOS)
      stopOnTerminate: false, // Continue running even if app is killed
      startOnBoot: true, // Start on device boot
    });

    console.log('[BackgroundAlerts] Background task registered successfully');
  } catch (error) {
    console.error('[BackgroundAlerts] Error registering background task:', error);
  }
};

/**
 * Unregister background task
 * Call this when user disables all alerts or logs out
 */
export const unregisterBackgroundFetch = async (): Promise<void> => {
  try {
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    console.log('[BackgroundAlerts] Background task unregistered');
  } catch (error) {
    console.error('[BackgroundAlerts] Error unregistering background task:', error);
  }
};

/**
 * Check background task status
 */
export const getBackgroundFetchStatus = async (): Promise<BackgroundTask.BackgroundTaskStatus> => {
  return await BackgroundTask.getStatusAsync();
};

/**
 * Manually trigger a background fetch (for testing)
 */
export const triggerManualFetch = async (isTest: boolean = false): Promise<{ triggered: number; errors: any[] }> => {
  const errors: any[] = [];
  let triggered = 0;

  try {
    console.log('[BackgroundAlerts] Triggering manual fetch');
    const apolloClient = getApolloClient();
    if (!apolloClient) {
      throw new Error('Apollo client not available');
    }

    const alerts = await loadAlerts();
    const enabledAlerts = alerts.filter((a) => a.enabled);
    const lastCheckTime = await loadLastCheckTime();

    let results;
    try {
      results = await evaluateAllAlerts(enabledAlerts, apolloClient, lastCheckTime);
    } catch (error) {
      console.error('[BackgroundAlerts] Error evaluating alerts:', error);
      errors.push(error);
      // Continue with empty results rather than failing completely
      results = new Map();
    }

    for (const alert of enabledAlerts) {
      try {
        const result = results.get(alert.id);
        if (result?.shouldTrigger) {
          // Modify message for test alerts
          const modifiedResult = isTest ? {
            ...result,
            message: `[TEST] ${result.message}`,
          } : result;

          await sendAlertNotification(alert, modifiedResult);
          triggered++;
          await updateAlert(alert.id, {
            lastTriggered: Date.now(),
            lastTriggeredRunId: result.runId,
          });
        }
        await updateAlert(alert.id, {
          lastChecked: Date.now(),
        });
      } catch (error) {
        console.error(`[BackgroundAlerts] Error processing alert ${alert.id}:`, error);
        errors.push(error);
        // Continue with other alerts
      }
    }

    await saveLastCheckTime(Date.now());
    const unreadCount = await getUnreadCount();
    await updateBadgeCount(unreadCount);

    console.log(`[BackgroundAlerts] Manual fetch completed. Triggered: ${triggered}, Errors: ${errors.length}`);
    return { triggered, errors };
  } catch (error) {
    console.error('[BackgroundAlerts] Critical error in manual fetch:', error);
    errors.push(error);
    return { triggered, errors };
  }
};
