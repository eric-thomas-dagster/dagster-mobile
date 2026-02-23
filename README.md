# Dagster+ Mobile

A mobile-optimized React Native app for monitoring and observing your Dagster+ environment. This app provides a native mobile experience for Dagster+ customers who want to monitor their data pipelines on the go.

## Features

### 📊 Dashboard
- Overview of your Dagster+ environment
- Quick stats on jobs, assets, and recent runs
- Real-time status indicators
- Pull-to-refresh functionality
- Share functionality for easy linking

### 📦 Assets
- Browse all assets in your workspace
- Search and filter assets by name and health status
- View asset materialization status
- Detailed asset information and metadata
- Materialization history with timestamps
- **Asset-level insights** with interactive charts
- Health-based filtering (healthy, missing, failed, stale)
- Catalog view filtering

### 💼 Jobs
- List all jobs in your workspace
- Job status monitoring
- Schedule and sensor information
- Detailed job configuration
- Recent run history per job
- Quick access to create job-specific alerts

### 🏃‍♂️ Runs
- Recent pipeline runs across all jobs
- Run status and statistics
- Execution plan details
- Run history and logs
- Status-based filtering
- Detailed run information with timing

### 🤖 Automations
- Monitor schedules and sensors
- View auto-materialization policies
- Filter by automation type
- Automation execution history
- Status tracking (running, stopped, etc.)

### 📈 Insights
- **NEW**: Visual analytics for your Dagster environment
- Interactive charts showing materialization trends
- Time-series data for asset materializations
- Catalog view filtering for focused insights
- Touch-responsive charts optimized for mobile

### 🔔 Alerts (Mobile-Only)
- **NEW**: Local mobile alerts for pipeline events
- Alert types:
  - Job failure/success notifications
  - Asset failure/success notifications
  - Any job failure/success notifications
- Background polling every 15 minutes
- Local push notifications
- Alert management (enable/disable/delete)
- Smart alert creation from detail screens
- **Note**: Alerts are local to your device and not synchronized with Dagster+ web UI

### 🔒 Security
- **Biometric authentication** (Face ID, Touch ID, Fingerprint)
- Platform-aware authentication prompts
- Secure token storage with Expo SecureStore
- Optional authentication bypass for development

### ⚙️ Settings
- Configure Dagster+ API connection
- Manage multiple deployments
- Test API connectivity
- Dark mode support
- Biometric authentication toggle
- Clear cache and reset app data

## Mobile-Optimized Design

- **Touch-friendly interface**: Large buttons and cards optimized for mobile interaction
- **Responsive layout**: Adapts to different screen sizes and orientations
- **Pull-to-refresh**: Native mobile gesture for data updates
- **Search functionality**: Quick filtering of assets, jobs, runs, and automations
- **Status indicators**: Color-coded badges for quick status recognition
- **Interactive charts**: Touch-responsive visualizations with sparse labels
- **Biometric security**: Native Face ID/Touch ID/Fingerprint authentication
- **Background alerts**: Local notifications via background fetch
- **Safe area handling**: Proper spacing around device notches and system UI
- **Platform-aware UI**: iOS and Android specific adaptations
- **Share functionality**: Easy sharing of run, job, and asset details
- **Cached data**: Graceful offline handling with stored data

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dagster-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your Dagster+ API**
   
   Edit `config/env.ts` with your Dagster+ instance details:
   ```typescript
   export const ENV_CONFIG = {
     DAGSTER_API_URL: 'https://your-instance.cloud.dagster.io/graphql',
     DAGSTER_API_TOKEN: 'your_api_token_here',
     DEFAULT_WORKSPACE: 'your_workspace_name',
     // ... other config
   };
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # For iOS
   npm run ios
   
   # For Android
   npm run android
   
   # For web (development)
   npm run web
   ```

### Configuration

The app uses the same GraphQL API as the Dagster+ web interface. You'll need:

1. **API URL**: Your Dagster+ instance GraphQL endpoint
2. **API Token**: Authentication token for your Dagster+ instance
3. **Workspace**: Default workspace to monitor

You can configure these in the Settings screen within the app.

## Development

### Project Structure

```
dagster-mobile/
├── components/
│   ├── navigation/          # Navigation components
│   ├── screens/            # Screen components
│   ├── AssetInsights.tsx   # Asset-level insights component
│   ├── BiometricAuth.tsx   # Biometric authentication
│   ├── ShareUrlHandler.tsx # Deep linking handler
│   └── ThemeProvider.tsx   # Theme context
├── lib/
│   ├── apollo-client.ts    # GraphQL client setup
│   ├── graphql/
│   │   └── queries.ts      # GraphQL queries
│   ├── types/
│   │   ├── dagster.ts      # Dagster types
│   │   └── alerts.ts       # Alert types
│   └── utils/
│       ├── alertStorage.ts      # Alert persistence
│       ├── alertEvaluation.ts   # Alert rule evaluation
│       ├── backgroundAlerts.ts  # Background fetch
│       └── notificationUtils.ts # Notification helpers
├── config/
│   └── env.ts             # Environment configuration
└── App.tsx                # Main app component
```

### Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo SDK 54**: Development platform and tools
- **Apollo Client**: GraphQL client for data fetching
- **React Navigation**: Navigation between screens with bottom tabs
- **React Native Paper**: Material Design components
- **TypeScript**: Type safety and better development experience
- **Expo Notifications**: Local push notifications
- **Expo Background Fetch**: Background task execution for alerts
- **Expo Local Authentication**: Biometric authentication
- **Expo SecureStore**: Secure credential storage
- **AsyncStorage**: Local data persistence
- **React Native Chart Kit**: Data visualization

### Adding New Features

1. **New Screens**: Add to `components/screens/`
2. **New Queries**: Add to `lib/graphql/queries.ts`
3. **New Types**: Add to `lib/types/dagster.ts`
4. **Navigation**: Update `components/navigation/AppNavigator.tsx`

## API Integration

The app uses the same GraphQL API as the Dagster+ web interface:

- **Assets**: Query asset definitions, materializations, metadata, and insights
- **Jobs**: Query job status, schedules, and sensors
- **Runs**: Query run history, statistics, and execution plans
- **Automations**: Query schedules, sensors, and auto-materialization policies
- **Insights**: Query time-series materialization data
- **Real-time updates**: Pull-to-refresh for latest data
- **Background polling**: Periodic checks for alert conditions (every 15 minutes)

## Deployment

### Building for Production

1. **Configure environment variables**
2. **Build the app**
   ```bash
   # For iOS
   expo build:ios
   
   # For Android
   expo build:android
   ```

### App Store Deployment

1. **iOS App Store**: Use Expo's build service or EAS Build
2. **Google Play Store**: Use Expo's build service or EAS Build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the [Dagster+ documentation](https://docs.dagster.io/)
- Open an issue in this repository
- Contact the development team

## Roadmap

- [x] Push notifications for run status changes (via local alerts)
- [x] Advanced filtering and sorting
- [x] Data visualization with charts
- [x] Biometric authentication
- [x] Dark mode support
- [ ] Deep linking support (requires server-side configuration)
- [ ] Run logs viewer with streaming
- [ ] Asset lineage visualization
- [ ] Multi-workspace support
- [ ] Real-time WebSocket updates
- [ ] Custom alert conditions
- [ ] Sync alerts with Dagster+ web UI 