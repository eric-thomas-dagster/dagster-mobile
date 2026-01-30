# Deep Linking Testing Guide

## Current Status

The deep linking implementation is **complete and working**. However, automatic deep linking from Slack/email requires domain verification files from Dagster+.

## What Works Now

### 1. Custom URL Scheme (`dagster-mobile://`)

You can test deep linking using the custom URL scheme:

#### Android Testing
```bash
# Test asset deep link
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats"

# Test job deep link
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/jobs/job_name"

# Test sensor deep link
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name"

# Test run deep link
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/runs/12345"
```

#### iOS Testing (Simulator)
```bash
# Test asset deep link
xcrun simctl openurl booted "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats"

# Test job deep link
xcrun simctl openurl booted "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/jobs/job_name"
```

### 2. Android Intent Filters ("Open with" Dialog)

On Android, when you click a `https://[org].dagster.cloud/...` link:
- The app **should appear** in the "Open with" dialog
- User must manually select "Dagster+ Mobile"
- This is because `autoVerify: false` in app.json

#### Testing Android Intent Filters

1. Build and install the app on an Android device/emulator:
   ```bash
   expo run:android
   ```

2. Open any app that can display links (Chrome, Gmail, Slack app, etc.)

3. Click on a Dagster+ URL like:
   ```
   https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats
   ```

4. You should see:
   - "Open with" dialog appears
   - "Dagster+ Mobile" listed as an option
   - Browser also listed as an option

5. Select "Dagster+ Mobile" - the app should open and navigate to the correct screen

**Note**: This won't work in Slack's in-app browser on some devices. Try using Chrome or Gmail instead.

### 3. Expo Go Testing

If using Expo Go for development:

```bash
# Use the expo-linking helper
npx uri-scheme open "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats" --ios

# For Android
npx uri-scheme open "dagster-mobile://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats" --android
```

## What Doesn't Work (Yet)

### Automatic Deep Linking from Slack/Email

When you click a link in Slack or an email, it opens in the browser instead of the app because:

#### Android
- Needs `autoVerify: true` in intent filters
- Needs Digital Asset Links file at: `https://*.dagster.cloud/.well-known/assetlinks.json`
- File must contain your app's package name and SHA-256 certificate fingerprint

#### iOS
- Needs Apple App Site Association (AASA) file at: `https://*.dagster.cloud/.well-known/apple-app-site-association`
- File must contain your app's bundle ID and team ID

**These files can only be added by Dagster+** since they control the domain.

## How to Enable Automatic Deep Linking

### Step 1: Get Your App Credentials

#### Android SHA-256 Fingerprint

For development builds:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For production builds:
```bash
keytool -list -v -keystore path/to/your/release.keystore -alias your-alias
```

Look for the "SHA256:" line in the output.

#### iOS Team ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to "Membership" section
3. Your Team ID is displayed there

### Step 2: Request Dagster+ to Add Verification Files

Contact Dagster+ support and provide:

**For Android:**
```json
{
  "package_name": "com.dagster.mobile",
  "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_HERE"]
}
```

**For iOS:**
```json
{
  "appID": "TEAM_ID.com.dagster.mobile",
  "paths": ["*"]
}
```

### Step 3: Test After Deployment

Once Dagster+ adds the verification files:

1. **Verify files are accessible:**
   ```bash
   # Android
   curl https://hooli.dagster.cloud/.well-known/assetlinks.json

   # iOS
   curl https://hooli.dagster.cloud/.well-known/apple-app-site-association
   ```

2. **Clear app data and reinstall:**
   - Android: Uninstall and reinstall the app
   - iOS: Delete app and reinstall

3. **Test automatic opening:**
   - Click a Dagster+ link in Slack
   - Should automatically open the mobile app
   - No browser or "Open with" dialog should appear

## Supported URL Formats

The app supports three URL formats:

### 1. Subdomain Format (Recommended)
```
https://[org].dagster.cloud/[deployment]/workspace/[workspace]/[type]/[name]
```
Example:
```
https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats
```

### 2. Direct Format
```
https://dagster.cloud/[org]/[deployment]/workspace/[workspace]/[type]/[name]
```
Example:
```
https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__@hooli_airlift/assets/continent_stats
```

### 3. No Workspace Format
```
https://dagster.cloud/[org]/[deployment]/[type]/[name]
```
Example (uses default workspace):
```
https://dagster.cloud/hooli/data-eng-prod/assets/continent_stats
```

## Supported Resource Types

- **Assets**: `/assets/[path]` - Asset detail screen
- **Jobs**: `/jobs/[name]` - Job detail screen
- **Sensors**: `/sensors/[name]` - Automation detail screen
- **Schedules**: `/schedules/[name]` - Automation detail screen
- **Runs**: `/runs/[id]` - Run detail screen

## Debugging Deep Links

### Enable Debug Logging

The app logs all deep link activity. To view logs:

#### Android
```bash
# React Native logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filter for deep link logs
adb logcat | grep -i "deep link\|linking"
```

#### iOS
```bash
# Use React Native debugger or
npx react-native log-ios
```

### Common Issues

#### 1. Link Opens in Browser
- **Cause**: Domain verification files don't exist
- **Solution**: Use custom URL scheme or "Open with" dialog for now

#### 2. "Open with" Dialog Doesn't Show (Android)
- **Cause**: Intent filters not registered or app not installed via store
- **Solution**: Rebuild and reinstall the app

#### 3. App Opens But Doesn't Navigate
- **Cause**: URL parsing failed or navigation params incorrect
- **Check logs**: Look for "Invalid Dagster URL" or "Could not get navigation params"

#### 4. Wrong Deployment Shown
- **Cause**: Deployment switching didn't complete
- **Check logs**: Look for "Switching deployment" messages
- **Solution**: Add delay or force refresh after deployment switch

## Alternative: Create Your Own Redirect Service

If Dagster+ can't add verification files, you can create your own redirect service:

### Setup

1. Register a domain (e.g., `dagster-app.link`)
2. Host verification files on your domain
3. Create a simple redirect service:

```javascript
// Redirect Dagster+ URLs to your custom domain
// Example: dagster-app.link/redirect?url=https://hooli.dagster.cloud/...
app.get('/redirect', (req, res) => {
  const url = req.query.url;
  // Validate it's a Dagster+ URL
  if (url && url.includes('dagster.cloud')) {
    res.redirect(`dagster-mobile://${url}`);
  }
});
```

4. Share links using your redirect service:
   ```
   https://dagster-app.link/redirect?url=https://hooli.dagster.cloud/data-eng-prod/...
   ```

## Summary

✅ **What's Ready:**
- Deep linking code is fully implemented
- Custom URL scheme works (`dagster-mobile://`)
- Android intent filters configured (manual selection)
- Deployment switching works
- All resource types supported (assets, jobs, sensors, schedules, runs)

❌ **What's Missing:**
- Domain verification files from Dagster+
- These files are required for automatic opening from Slack/email

🎯 **Next Steps:**
1. Use custom URL scheme for testing (`dagster-mobile://`)
2. Test "Open with" dialog on Android
3. Contact Dagster+ to request verification files
4. Once files are added, test automatic opening

The app is **ready to go** - it just needs Dagster+ to add those verification files!
