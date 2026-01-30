# Testing Deep Links

## ⚠️ Important: Expo Go Limitation

**Universal Links (iOS) and App Links (Android) DO NOT work in Expo Go.**

When you click a Dagster+ URL in Slack, it uses **Universal Links** (iOS) or **App Links** (Android). These features require:

1. **App signing and bundle ID**: The app must be properly signed and have a registered bundle ID (`com.dagster.mobile`)
2. **Associated Domains**: The app must be configured with the domain in its entitlements
3. **Apple App Site Association (AASA) file**: For iOS, the domain must serve an AASA file
4. **Digital Asset Links**: For Android, the domain must serve a Digital Asset Links file

**Expo Go doesn't support these features** because:
- Expo Go uses Expo's bundle ID (`host.exp.Exponent`), not your app's bundle ID (`com.dagster.mobile`)
- The associated domains are configured for Expo's app, not yours
- Universal Links/App Links only work with standalone builds
- That's why clicking links in Slack takes you to the Dagster sign-in page instead of opening the app

## Testing Options

### Option 1: Build a Development Build (Recommended for Testing)

Development builds allow you to test deep linking while still using Expo's development tools:

```bash
# Build for Android
eas build --profile development --platform android

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

Then install the development build on your device and test deep links.

### Option 2: Build a Production APK/AAB

Build a production version for testing:

```bash
# Build Android APK
eas build --profile production --platform android

# Or build AAB
eas build --profile production --platform android --type app-bundle
```

### Option 3: Test Custom URL Scheme in Expo Go (Limited)

You can test the custom URL scheme (`dagster-mobile://`) in Expo Go, but Universal Links won't work:

**On Android (via ADB):**
```bash
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://automation/sensor_name"
```

**On iOS (via Simulator):**
```bash
xcrun simctl openurl booted "dagster-mobile://automation/sensor_name"
```

**Note**: This only tests the custom scheme, not the Universal Links from Slack.

### Option 4: Manual Testing in App

You can manually trigger deep link handling in the app by:

1. Adding a test button that simulates a deep link
2. Using the Expo Linking API directly in development

## Setting Up Universal Links for Production

For Universal Links to work in production, you'll need:

### iOS (Universal Links)

1. **Apple App Site Association (AASA) file**: 
   - Must be hosted at `https://*.dagster.cloud/.well-known/apple-app-site-association`
   - Format:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAM_ID.com.dagster.mobile",
           "paths": ["*"]
         }
       ]
     }
   }
   ```

2. **App configuration**: Already done in `app.json` with `associatedDomains`

### Android (App Links)

1. **Digital Asset Links file**:
   - Must be hosted at `https://*.dagster.cloud/.well-known/assetlinks.json`
   - Format:
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

2. **App configuration**: Already done in `app.json` with `associatedDomains`

## Quick Test: Custom URL Scheme

To quickly verify the deep linking code works (without Universal Links), you can test the custom scheme:

1. **Start your Expo app**:
   ```bash
   npx expo start
   ```

2. **Test with ADB (Android)**:
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://automation/sensor_name"
   ```

3. **Test with Simulator (iOS)**:
   ```bash
   xcrun simctl openurl booted "dagster-mobile://automation/sensor_name"
   ```

## ✅ Recommendation: Build an APK

**Yes, you need to build an APK (or development build) to test Universal Links from Slack.**

For proper testing of Universal Links from Slack:

1. **Build an APK** using EAS Build:
   ```bash
   eas build --profile production --platform android
   ```
   
   Or for a development build (faster, allows hot reload):
   ```bash
   eas build --profile development --platform android
   ```

2. **Install the APK** on your Android device

3. **Test clicking links in Slack** - they should now open the app instead of the browser

The deep linking code is **already implemented** and will work once you have a proper build installed.

## Quick Test: Custom URL Scheme in Expo Go

While you can't test Universal Links in Expo Go, you CAN test the custom URL scheme to verify the code works:

1. **Start your Expo app**:
   ```bash
   npx expo start
   ```

2. **Test with ADB (Android)**:
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://automation/sensor_name"
   ```

3. **Test with Simulator (iOS)**:
   ```bash
   xcrun simctl openurl booted "dagster-mobile://automation/sensor_name"
   ```

**Note**: This only tests the custom scheme parsing and navigation logic. Universal Links from Slack won't work until you have a proper build.

