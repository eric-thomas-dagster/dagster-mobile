import * as BackgroundFetch from 'expo-background-fetch';
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

const BACKGROUND_FETCH_TASK = 'DAGSTER_ALERTS_BACKGROUND_FETCH';

// Register the background fetch task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[BackgroundAlerts] Running background fetch task');

    // Get Apollo client
    const apolloClient = getApolloClient();
    if (!apolloClient) {
      console.error('[BackgroundAlerts] Apollo client not available');
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Load all alerts
    const alerts = await loadAlerts();
    const enabledAlerts = alerts.filter((a) => a.enabled);

    if (enabledAlerts.length === 0) {
      console.log('[BackgroundAlerts] No enabled alerts');
      return BackgroundFetch.BackgroundFetchResult.NoData;
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
      `[BackgroundAlerts] Background fetch completed. Sent ${notificationsSent} notifications.`
    );

    return notificationsSent > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundAlerts] Error in background fetch:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background fetch task
 * Call this once during app initialization
 */
export const registerBackgroundFetch = async (): Promise<void> => {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      console.log('[BackgroundAlerts] Background fetch already registered');
      return;
    }

    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed on iOS)
      stopOnTerminate: false, // Continue running even if app is killed
      startOnBoot: true, // Start on device boot
    });

    console.log('[BackgroundAlerts] Background fetch registered successfully');
  } catch (error) {
    console.error('[BackgroundAlerts] Error registering background fetch:', error);
  }
};

/**
 * Unregister background fetch task
 * Call this when user disables all alerts or logs out
 */
export const unregisterBackgroundFetch = async (): Promise<void> => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('[BackgroundAlerts] Background fetch unregistered');
  } catch (error) {
    console.error('[BackgroundAlerts] Error unregistering background fetch:', error);
  }
};

/**
 * Check background fetch status
 */
export const getBackgroundFetchStatus = async (): Promise<BackgroundFetch.BackgroundFetchStatus> => {
  return await BackgroundFetch.getStatusAsync();
};

/**
 * Manually trigger a background fetch (for testing)
 */
export const triggerManualFetch = async (): Promise<void> => {
  try {
    console.log('[BackgroundAlerts] Triggering manual fetch');
    const apolloClient = getApolloClient();
    if (!apolloClient) {
      throw new Error('Apollo client not available');
    }

    const alerts = await loadAlerts();
    const enabledAlerts = alerts.filter((a) => a.enabled);
    const lastCheckTime = await loadLastCheckTime();
    const results = await evaluateAllAlerts(enabledAlerts, apolloClient, lastCheckTime);

    for (const alert of enabledAlerts) {
      const result = results.get(alert.id);
      if (result?.shouldTrigger) {
        await sendAlertNotification(alert, result);
        await updateAlert(alert.id, {
          lastTriggered: Date.now(),
          lastTriggeredRunId: result.runId,
        });
      }
      await updateAlert(alert.id, {
        lastChecked: Date.now(),
      });
    }

    await saveLastCheckTime(Date.now());
    const unreadCount = await getUnreadCount();
    await updateBadgeCount(unreadCount);

    console.log('[BackgroundAlerts] Manual fetch completed');
  } catch (error) {
    console.error('[BackgroundAlerts] Error in manual fetch:', error);
    throw error;
  }
};
