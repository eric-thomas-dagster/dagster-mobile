# Deep Linking: Why It Works This Way and How It Could Be Better

## Current Behavior

When you click a Dagster+ URL in Slack, it opens in a web browser (showing the sign-in page) instead of opening the mobile app. This is the expected behavior given the current setup.

## Why This Happens

### Universal Links / App Links Require Domain Verification

For Universal Links (iOS) and App Links (Android) to work automatically, the domain owner (Dagster+) must host verification files that prove your app is authorized to handle links from that domain.

#### Android App Links
- **Required**: `https://*.dagster.cloud/.well-known/assetlinks.json`
- **Must contain**: Your app's package name (`com.dagster.mobile`) and SHA-256 certificate fingerprint
- **Purpose**: Proves to Android that your app is authorized to handle `*.dagster.cloud` URLs

#### iOS Universal Links
- **Required**: `https://*.dagster.cloud/.well-known/apple-app-site-association`
- **Must contain**: Your app's bundle ID (`com.dagster.mobile`) and Team ID
- **Purpose**: Proves to iOS that your app is authorized to handle `*.dagster.cloud` URLs

### What We've Configured

The app is configured to handle:
1. **Custom URL scheme**: `dagster-mobile://` - Works, but requires special URLs
2. **Intent filters** (Android): Shows app in "Open with" dialog - May work, but not automatic
3. **Associated domains**: `applinks:*.dagster.cloud` - Requires domain verification files

### Why It Doesn't Work Automatically

**The domain verification files don't exist** because:
- Dagster+ controls the `*.dagster.cloud` domain
- They would need to add your app's information to these files
- Without these files, the OS doesn't know your app can handle these URLs
- So it defaults to opening them in a browser

## Current Workarounds

### 1. Intent Filters (Android)
We've added Android intent filters with `autoVerify: false`. This means:
- ✅ The app will appear in the "Open with" dialog when clicking links
- ❌ It won't open automatically (requires user selection)
- ⚠️ May not work in all apps (Slack's web view might not show the dialog)

### 2. Share to App Feature
We've added a "Share" button in the app that:
- ✅ Checks clipboard for Dagster+ URLs
- ✅ Allows users to paste and open URLs
- ✅ Works regardless of domain verification

### 3. Custom URL Scheme
The app handles `dagster-mobile://` URLs, but:
- ❌ Slack doesn't support custom URL schemes for links
- ✅ Works if you manually create/share these URLs
- ✅ Useful for internal sharing or testing

## How It Could Be Better

### Option 1: Dagster+ Adds Verification Files (Best Solution)

**What's needed:**
1. Contact Dagster+ support to request verification files
2. Provide them with:
   - Package name: `com.dagster.mobile`
   - SHA-256 fingerprint (from your keystore)
   - iOS Team ID and Bundle ID (if supporting iOS)

**Result:**
- ✅ Links in Slack automatically open the app
- ✅ No user interaction required
- ✅ Works across all apps and platforms
- ✅ Best user experience

### Option 2: Dagster+ Provides Custom URL Scheme Support

**What's needed:**
- Dagster+ could generate links with custom URL schemes
- Example: `dagster-mobile://https://hooli.dagster.cloud/...`

**Result:**
- ✅ Would work if Slack supported custom schemes
- ⚠️ Still requires user to choose app (if multiple handlers)
- ⚠️ Slack may not support this

### Option 3: Redirect Service

**What's needed:**
- Create a redirect service (e.g., `dagster-app.link`)
- Host verification files on your domain
- Redirect Dagster+ URLs through your service

**Result:**
- ✅ Full control over verification
- ✅ Works automatically
- ⚠️ Requires maintaining a redirect service
- ⚠️ Additional infrastructure cost

### Option 4: Enhanced Share Feature

**What's needed:**
- Improve the "Share to App" feature
- Add browser extension/bookmarklet
- Add "Open in App" button on Dagster+ web pages

**Result:**
- ✅ Works today without Dagster+ changes
- ⚠️ Requires user action
- ⚠️ Not as seamless as automatic opening

## Technical Details

### Android Intent Filters

We've configured intent filters in `app.json`:

```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": false,
        "data": [
          {
            "scheme": "https",
            "host": "*.dagster.cloud",
            "pathPrefix": "/"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

**What this does:**
- Tells Android the app can handle `https://*.dagster.cloud` URLs
- `autoVerify: false` means we skip domain verification
- App will appear in "Open with" dialog
- Won't open automatically (requires user selection)

### iOS Universal Links

Configured via `associatedDomains` in `app.json`:

```json
{
  "associatedDomains": [
    "applinks:*.dagster.cloud"
  ]
}
```

**What this does:**
- Tells iOS the app can handle `*.dagster.cloud` URLs
- Requires AASA file on the domain (doesn't exist)
- Without AASA file, iOS ignores this configuration

## Testing

### Test Intent Filters (Android)

1. Click a Dagster+ URL in any app
2. You should see "Open with" dialog
3. Select "Dagster+ Mobile"
4. App should open and navigate to the correct screen

### Test Share Feature

1. Copy a Dagster+ URL to clipboard
2. Open the app
3. Tap the share icon (top right)
4. Tap "Paste & Open"
5. App should navigate to the correct screen

### Test Custom URL Scheme

```bash
# Android
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name"
```

## Recommendations

1. **Short term**: Use the "Share to App" feature for now
2. **Medium term**: Contact Dagster+ to request verification files
3. **Long term**: Work with Dagster+ to add official mobile app support

## Getting Your SHA-256 Fingerprint

To request Dagster+ add verification files, you'll need your app's SHA-256 fingerprint:

```bash
# For debug keystore (development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore (production)
keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
```

Look for "SHA256:" in the output.

## Using Expo Linking API

Based on the [Expo Linking documentation](https://docs.expo.dev/linking/into-your-app/), we're using:

1. **`Linking.getInitialURL()`**: Gets the URL that launched the app
2. **`Linking.addEventListener('url', callback)`**: Listens for URLs while app is running
3. **`Linking.parse()`**: Parses URLs to extract hostname, path, and query parameters

This follows Expo's recommended approach for handling deep links.

## Summary

- **Current state**: Links open in browser because domain verification files don't exist
- **Workaround**: Use "Share to App" feature or "Open with" dialog
- **Best solution**: Dagster+ adds verification files for your app
- **App is ready**: All deep linking code is implemented and working
- **Expo Linking API**: Using recommended Expo methods for URL handling

The app is fully configured and ready - it just needs the domain verification files from Dagster+ to work automatically with Slack links. The implementation follows Expo's best practices for deep linking.

