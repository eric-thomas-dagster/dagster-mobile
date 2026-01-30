# Universal Links / App Links Setup Issue

## The Problem

When you click a Dagster+ URL in Slack, it goes to the sign-in page instead of opening your app. This is because **Universal Links (iOS) and App Links (Android) require domain verification files** that must be hosted by Dagster+.

## Why It's Not Working

For Universal Links/App Links to work, the domain (`*.dagster.cloud`) needs to serve verification files:

### Android App Links
- **Required file**: `https://*.dagster.cloud/.well-known/assetlinks.json`
- **Content**: Must include your app's package name and SHA-256 fingerprint
- **Example**:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.dagster.mobile",
    "sha256_cert_fingerprints": ["YOUR_APP_SHA256_FINGERPRINT"]
  }
}]
```

### iOS Universal Links
- **Required file**: `https://*.dagster.cloud/.well-known/apple-app-site-association`
- **Content**: Must include your app's bundle ID and team ID
- **Example**:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.dagster.mobile",
      "paths": ["*"]
    }]
  }
}
```

**Since Dagster+ controls the domain, they would need to add these files for your app.**

## Workarounds

### Option 1: Share Link Feature (Recommended)

Add a "Share" or "Open in App" button in the app that:
1. Generates a custom URL scheme link
2. Users can copy and paste, or share to themselves
3. The app handles the custom scheme

### Option 2: Intent Filters (Android Only - Partial Solution)

Android can use intent filters without domain verification, but they're less reliable:
- Links might show a "Open with" dialog instead of opening directly
- Works better for custom URL schemes

### Option 3: Request Dagster+ to Add Verification Files

Contact Dagster+ support to request they add the verification files for your app. You'll need to provide:
- Your app's package name: `com.dagster.mobile`
- Your app's SHA-256 fingerprint (from your keystore)
- Your iOS Team ID and Bundle ID (if supporting iOS)

## Current Implementation

The app is already configured to handle:
- **Custom URL scheme**: `dagster-mobile://`
- **Universal Links**: `https://*.dagster.cloud` (requires domain verification)

The deep linking code is ready - it just needs the domain verification files to work with Slack links.

## Testing Custom URL Scheme

You can test the custom URL scheme works:

```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/mwaa_hooli_airflow_01__airflow_dag_status_sensor"

# Or test with a simplified format
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://sensor/mwaa_hooli_airflow_01__airflow_dag_status_sensor"
```

## Next Steps

1. **Contact Dagster+**: Request they add the verification files for your app
2. **Implement Share Feature**: Add a way for users to generate shareable links with the custom scheme
3. **Use Intent Filters**: Configure Android intent filters (will show "Open with" dialog)

