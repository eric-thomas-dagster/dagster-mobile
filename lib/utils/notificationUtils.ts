import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AlertRule, AlertNotification, AlertEvaluationResult } from '../types/alerts';
import { addNotification } from './alertStorage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep for backwards compatibility
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Dagster Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F43DD',
      sound: 'default',
    });
  }

  return true;
};

/**
 * Send a local notification for an alert
 */
export const sendAlertNotification = async (
  alert: AlertRule,
  result: AlertEvaluationResult
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Cannot send notification - permission not granted');
      return;
    }

    // Create notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: alert.name,
        body: result.message,
        data: {
          alertId: alert.id,
          runId: result.runId,
          assetKey: result.assetKey,
          type: alert.type,
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });

    // Save to notification history
    const notification: AlertNotification = {
      id: `${Date.now()}-${Math.random()}`,
      alertId: alert.id,
      alertName: alert.name,
      type: alert.type,
      targetName: alert.targetName,
      triggeredAt: Date.now(),
      runId: result.runId,
      assetKey: result.assetKey,
      message: result.message,
      read: false,
    };

    await addNotification(notification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Update badge count with unread notifications
 */
export const updateBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error updating badge count:', error);
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

/**
 * Get notification that was tapped to open the app
 */
export const getLastNotificationResponse = async () => {
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const { loadNotifications } = await import('./alertStorage');
    const notifications = await loadNotifications();
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
