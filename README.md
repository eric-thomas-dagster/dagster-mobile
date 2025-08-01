# Dagster+ Mobile

A mobile-optimized React Native app for monitoring and observing your Dagster+ environment. This app provides a native mobile experience for Dagster+ customers who want to monitor their data pipelines on the go.

## Features

### 📊 Dashboard
- Overview of your Dagster+ environment
- Quick stats on jobs, assets, and recent runs
- Real-time status indicators
- Pull-to-refresh functionality

### 📦 Assets
- Browse all assets in your workspace
- Search and filter assets
- View asset materialization status
- Detailed asset information and metadata
- Materialization history

### ⚙️ Jobs
- List all jobs in your workspace
- Job status monitoring
- Schedule and sensor information
- Detailed job configuration

### 🏃‍♂️ Runs
- Recent pipeline runs
- Run status and statistics
- Execution plan details
- Run history and logs

### ⚙️ Settings
- Configure Dagster+ API connection
- Customize app preferences
- Test API connectivity
- Dark mode support

## Mobile-Optimized Design

- **Touch-friendly interface**: Large buttons and cards optimized for mobile interaction
- **Responsive layout**: Adapts to different screen sizes
- **Pull-to-refresh**: Native mobile gesture for data updates
- **Search functionality**: Quick filtering of assets, jobs, and runs
- **Status indicators**: Color-coded badges for quick status recognition
- **Offline support**: Cached data with graceful error handling

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
│   ├── navigation/     # Navigation components
│   └── screens/        # Screen components
├── lib/
│   ├── apollo-client.ts    # GraphQL client setup
│   ├── graphql/
│   │   └── queries.ts      # GraphQL queries
│   └── types/
│       └── dagster.ts      # TypeScript types
├── config/
│   └── env.ts             # Environment configuration
└── App.tsx                # Main app component
```

### Key Technologies

- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **Apollo Client**: GraphQL client for data fetching
- **React Navigation**: Navigation between screens
- **React Native Paper**: Material Design components
- **TypeScript**: Type safety and better development experience

### Adding New Features

1. **New Screens**: Add to `components/screens/`
2. **New Queries**: Add to `lib/graphql/queries.ts`
3. **New Types**: Add to `lib/types/dagster.ts`
4. **Navigation**: Update `components/navigation/AppNavigator.tsx`

## API Integration

The app uses the same GraphQL API as the Dagster+ web interface:

- **Assets**: Query asset definitions, materializations, and metadata
- **Jobs**: Query job status, schedules, and sensors
- **Runs**: Query run history, statistics, and execution plans
- **Real-time updates**: Pull-to-refresh for latest data

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

- [ ] Push notifications for run status changes
- [ ] Offline mode with data caching
- [ ] Advanced filtering and sorting
- [ ] Custom dashboards
- [ ] Run logs viewer
- [ ] Asset lineage visualization
- [ ] Multi-workspace support 