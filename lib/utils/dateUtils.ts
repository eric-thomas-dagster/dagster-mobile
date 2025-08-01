/**
 * Utility functions for handling Dagster+ timestamps
 * Dagster+ may send Unix timestamps in seconds, which need to be converted to milliseconds
 */

export const parseDagsterTimestamp = (timestamp: string | number | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  try {
    // If it's already a number, assume it's a Unix timestamp in seconds
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000);
    }
    
    // If it's a string, try to parse it
    const num = parseFloat(timestamp);
    if (!isNaN(num)) {
      // If the number is small (less than year 2000 in seconds), assume it's seconds
      if (num < 1000000000) {
        return new Date(num * 1000);
      }
      // Otherwise assume it's already in milliseconds
      return new Date(num);
    }
    
    // Try parsing as ISO string
    return new Date(timestamp);
  } catch (error) {
    console.warn('Failed to parse timestamp:', timestamp, error);
    return null;
  }
};

export const formatDagsterDate = (timestamp: string | number | null | undefined): string => {
  const date = parseDagsterTimestamp(timestamp);
  if (!date) return 'Unknown Date';
  
  try {
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

export const formatDagsterTime = (timestamp: string | number | null | undefined): string => {
  const date = parseDagsterTimestamp(timestamp);
  if (!date) return 'Unknown Time';
  
  try {
    if (isNaN(date.getTime())) return 'Invalid Time';
    return date.toLocaleTimeString();
  } catch (error) {
    return 'Invalid Time';
  }
};

export const formatDagsterDateTime = (timestamp: string | number | null | undefined): string => {
  const date = parseDagsterTimestamp(timestamp);
  if (!date) return 'Unknown Date/Time';
  
  try {
    if (isNaN(date.getTime())) return 'Invalid Date/Time';
    return date.toLocaleString();
  } catch (error) {
    return 'Invalid Date/Time';
  }
};

export const formatTimeAgo = (timestamp: string | number | null | undefined): string => {
  const date = parseDagsterTimestamp(timestamp);
  if (!date) return 'Never';
  
  try {
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  } catch (error) {
    return 'Invalid Date';
  }
}; 