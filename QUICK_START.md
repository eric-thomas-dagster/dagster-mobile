# Quick Start Guide

## Get Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Your Dagster+ Instance
Edit `config/env.ts` with your Dagster+ details:
```typescript
export const ENV_CONFIG = {
  DAGSTER_API_URL: 'https://your-instance.cloud.dagster.io/graphql',
  DAGSTER_API_TOKEN: 'your_api_token_here',
  DEFAULT_WORKSPACE: 'your_workspace_name',
  // ... other config
};
```

### 3. Start the App
```bash
npm start
```

### 4. Run on Your Device
- **iOS**: Press `i` in the terminal or scan the QR code with Expo Go app
- **Android**: Press `a` in the terminal or scan the QR code with Expo Go app
- **Web**: Press `w` in the terminal

## What You'll See

### 📊 Dashboard
- Overview of your Dagster+ environment
- Quick stats and recent activity
- Pull down to refresh

### 📦 Assets Tab
- Browse all your assets
- Search and filter
- Tap to see details

### ⚙️ Jobs Tab
- Monitor job status
- View schedules and sensors
- Tap for detailed info

### 🏃‍♂️ Runs Tab
- Recent pipeline runs
- Status and statistics
- Execution details

### ⚙️ Settings Tab
- Configure API connection
- Test connectivity
- App preferences

## Mobile Features

- **Touch-friendly**: Large buttons and cards
- **Pull-to-refresh**: Update data with a swipe
- **Search**: Find assets, jobs, and runs quickly
- **Status badges**: Color-coded status indicators
- **Responsive**: Works on all screen sizes

## Troubleshooting

### Connection Issues
1. Check your API URL in Settings
2. Verify your API token is correct
3. Test connection in Settings tab

### App Not Loading
1. Make sure all dependencies are installed
2. Check your internet connection
3. Restart the development server

### Data Not Showing
1. Verify your workspace name
2. Check if your Dagster+ instance is accessible
3. Try refreshing the data

## Next Steps

- Configure notifications for run status changes
- Set up custom dashboards
- Explore advanced filtering options
- Check out the full documentation in README.md 