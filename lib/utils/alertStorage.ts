import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertRule, AlertNotification } from '../types/alerts';

const ALERTS_KEY = '@dagster_alerts';
const NOTIFICATIONS_KEY = '@dagster_alert_notifications';
const LAST_CHECK_KEY = '@dagster_last_alert_check';

// Alert Rules Management
export const saveAlerts = async (alerts: AlertRule[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error saving alerts:', error);
    throw error;
  }
};

export const loadAlerts = async (): Promise<AlertRule[]> => {
  try {
    const alertsJson = await AsyncStorage.getItem(ALERTS_KEY);
    return alertsJson ? JSON.parse(alertsJson) : [];
  } catch (error) {
    console.error('Error loading alerts:', error);
    return [];
  }
};

export const addAlert = async (alert: AlertRule): Promise<void> => {
  const alerts = await loadAlerts();
  alerts.push(alert);
  await saveAlerts(alerts);
};

export const updateAlert = async (alertId: string, updates: Partial<AlertRule>): Promise<void> => {
  const alerts = await loadAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts[index] = { ...alerts[index], ...updates };
    await saveAlerts(alerts);
  }
};

export const deleteAlert = async (alertId: string): Promise<void> => {
  const alerts = await loadAlerts();
  const filtered = alerts.filter(a => a.id !== alertId);
  await saveAlerts(filtered);
};

export const toggleAlert = async (alertId: string): Promise<void> => {
  const alerts = await loadAlerts();
  const index = alerts.findIndex(a => a.id === alertId);
  if (index !== -1) {
    alerts[index].enabled = !alerts[index].enabled;
    await saveAlerts(alerts);
  }
};

// Notification History Management
export const saveNotifications = async (notifications: AlertNotification[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

export const loadNotifications = async (): Promise<AlertNotification[]> => {
  try {
    const notificationsJson = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return notificationsJson ? JSON.parse(notificationsJson) : [];
  } catch (error) {
    console.error('Error loading notifications:', error);
    return [];
  }
};

export const addNotification = async (notification: AlertNotification): Promise<void> => {
  const notifications = await loadNotifications();
  notifications.unshift(notification); // Add to beginning
  // Keep only last 100 notifications
  const trimmed = notifications.slice(0, 100);
  await saveNotifications(trimmed);
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  const notifications = await loadNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    await saveNotifications(notifications);
  }
};

export const markAllNotificationsRead = async (): Promise<void> => {
  const notifications = await loadNotifications();
  notifications.forEach(n => n.read = true);
  await saveNotifications(notifications);
};

export const getUnreadCount = async (): Promise<number> => {
  const notifications = await loadNotifications();
  return notifications.filter(n => !n.read).length;
};

export const clearOldNotifications = async (daysToKeep: number = 7): Promise<void> => {
  const notifications = await loadNotifications();
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  const filtered = notifications.filter(n => n.triggeredAt > cutoffTime);
  await saveNotifications(filtered);
};

// Last Check Timestamp
export const saveLastCheckTime = async (timestamp: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_CHECK_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error saving last check time:', error);
  }
};

export const loadLastCheckTime = async (): Promise<number> => {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_CHECK_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now() - (1 * 60 * 60 * 1000); // Default to 1 hour ago
  } catch (error) {
    console.error('Error loading last check time:', error);
    return Date.now() - (1 * 60 * 60 * 1000);
  }
};
