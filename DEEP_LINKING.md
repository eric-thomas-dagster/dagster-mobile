# Deep Linking Guide

The Dagster+ Mobile app supports deep linking from Slack notifications and other sources. When users click on Dagster+ URLs, the app will open and navigate to the relevant screen.

## Supported URL Patterns

The app can handle Dagster+ URLs in the following formats:

### Sensors
```
https://[organization].dagster.cloud/[deployment]/workspace/[workspace]/sensors/[sensor_name]
```

Example:
```
https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/mwaa_hooli_airflow_01__airflow_dag_status_sensor
```

### Schedules
```
https://[organization].dagster.cloud/[deployment]/workspace/[workspace]/schedules/[schedule_name]
```

### Jobs
```
https://[organization].dagster.cloud/[deployment]/workspace/[workspace]/jobs/[job_name]
```

### Assets
```
https://[organization].dagster.cloud/[deployment]/workspace/[workspace]/assets/[asset_path]
```

### Runs
```
https://[organization].dagster.cloud/[deployment]/workspace/[workspace]/runs/[run_id]
```

## How It Works

1. **URL Parsing**: When a deep link is received, the app parses the URL to extract:
   - Organization name
   - Deployment name
   - Workspace/repository information
   - Resource type (sensor, schedule, job, asset, run)
   - Resource identifier (name, path, or ID)

2. **Deployment Switching**: If the URL points to a different deployment than the currently configured one, the app will:
   - Switch the Apollo Client to the new deployment's GraphQL endpoint
   - Update stored settings
   - Wait for the connection to be established

3. **Navigation**: The app navigates to the appropriate tab and screen:
   - **Sensors/Schedules** → Automation tab → Automation Detail screen
   - **Jobs** → Jobs tab → Job Detail screen
   - **Assets** → Catalog tab → Asset Detail screen
   - **Runs** → Runs tab → Run Detail screen

## Configuration

Deep linking is configured in `app.json`:

```json
{
  "scheme": "dagster-mobile",
  "associatedDomains": [
    "applinks:*.dagster.cloud"
  ]
}
```

This enables:
- **Custom URL scheme**: `dagster-mobile://` URLs
- **Universal Links (iOS) / App Links (Android)**: `https://*.dagster.cloud` URLs

## Testing Deep Links

### iOS Simulator
```bash
xcrun simctl openurl booted "https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/mwaa_hooli_airflow_01__airflow_dag_status_sensor"
```

### Android Emulator
```bash
adb shell am start -a android.intent.action.VIEW -d "https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/mwaa_hooli_airflow_01__airflow_dag_status_sensor"
```

### From Slack
When a Slack notification contains a Dagster+ URL, clicking it will:
1. Open the mobile app (if installed)
2. Parse the URL
3. Navigate to the relevant screen

## Implementation Details

### URL Parser
Located in `lib/utils/deepLinkUtils.ts`:
- `parseDagsterUrl()`: Parses Dagster+ URLs into structured data
- `getNavigationParams()`: Converts parsed URL data into navigation parameters

### Navigation Handler
Located in `components/navigation/AppNavigator.tsx`:
- Listens for deep link events
- Handles deployment switching
- Navigates to the appropriate screen

### Screen Updates
- `AutomationDetailScreen`: Now supports deep linking with `automationName`, `automationType`, `repositoryName`, and `repositoryLocationName` parameters
- Other detail screens can be updated similarly to support name-based navigation

## Limitations

1. **Job Navigation**: Currently, job deep links require finding the job ID from the job name. This may require a GraphQL query to resolve.

2. **Deployment Switching**: When switching deployments, there's a brief delay (500ms) to ensure the Apollo Client connection is established.

3. **Error Handling**: If a resource cannot be found (e.g., sensor name doesn't exist), the app will show a loading state. Consider adding error messages for better UX.

## Future Enhancements

1. Add support for partition-based navigation
2. Add support for run tags and filters
3. Improve error handling and user feedback
4. Add analytics to track deep link usage

