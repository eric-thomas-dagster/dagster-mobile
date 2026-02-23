// Example environment configuration
// This file shows the structure for environment configuration

export const ENV_CONFIG = {
  // App configuration
  APP_NAME: 'Dagster+ Mobile',
  VERSION: '1.0.0',
  
  // Default values (users will configure their own)
  DEFAULT_DAGSTER_URL: 'https://your-dagster-instance.cloud/',
  DEFAULT_WORKSPACE: 'prod',
};

// Note: API tokens and instance URLs are now configured through the app's Settings screen
// This provides better security and allows users to configure their own Dagster instances 