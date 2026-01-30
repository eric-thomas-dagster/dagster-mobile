# Domain Verification Files for Deep Linking

For deep linking to work automatically when clicking Dagster+ links in email or Slack, Dagster+ needs to host verification files on their domain. Since you don't control `dagster.cloud`, you'll need to contact Dagster+ support to add these files.

## Files Required

### 1. Android App Links - `assetlinks.json`

**Location:** `https://dagster.cloud/.well-known/assetlinks.json`

**Also needed for subdomains:**
- `https://*.dagster.cloud/.well-known/assetlinks.json` (wildcard)
- OR individual files for each subdomain like:
  - `https://hooli.dagster.cloud/.well-known/assetlinks.json`
  - `https://your-org.dagster.cloud/.well-known/assetlinks.json`

**File Content:**
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.dagster.mobile",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**To get your SHA-256 fingerprint:**

Since you're using EAS Build, you can get the fingerprint from your build credentials:

1. **From EAS (recommended):**
   - Go to https://expo.dev/accounts/ethomasii/projects/dagster-mobile/credentials
   - Find your Android keystore
   - The SHA-256 fingerprint should be displayed there

2. **From a built APK:**
   ```bash
   # Extract the certificate from the APK
   unzip -p your-app.apk META-INF/*.RSA | keytool -printcert
   # Look for "SHA256:" in the output
   ```

3. **If you have the keystore file:**
   ```bash
   keytool -list -v -keystore path/to/your/keystore.jks -alias your-alias
   # Look for "SHA256:" in the output
   ```

**Important:** You'll need the SHA-256 fingerprint from your **release/production** keystore, not the debug keystore.

### 2. iOS Universal Links - `apple-app-site-association`

**Location:** `https://dagster.cloud/.well-known/apple-app-site-association`

**Also needed for subdomains:**
- `https://*.dagster.cloud/.well-known/apple-app-site-association` (wildcard)
- OR individual files for each subdomain

**File Content:**
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "YOUR_TEAM_ID.com.dagster.mobile",
        "paths": [
          "*"
        ]
      }
    ]
  }
}
```

**To get your Team ID:**
- Go to https://developer.apple.com/account
- Your Team ID is displayed in the top right corner
- Or check your Apple Developer account settings

**Note:** Your bundle ID is `com.dagster.mobile` (from `app.json`)

## What to Send to Dagster+ Support

When contacting Dagster+ support, provide:

1. **For Android:**
   - Package name: `com.dagster.mobile`
   - SHA-256 fingerprint: `[your fingerprint here]`
   - Request: Add to `https://dagster.cloud/.well-known/assetlinks.json` and `https://*.dagster.cloud/.well-known/assetlinks.json`

2. **For iOS (if supporting iOS):**
   - Bundle ID: `com.dagster.mobile`
   - Team ID: `[your team ID here]`
   - Request: Add to `https://dagster.cloud/.well-known/apple-app-site-association` and `https://*.dagster.cloud/.well-known/apple-app-site-association`

3. **URL patterns to support:**
   - `https://*.dagster.cloud/*`
   - `https://dagster.cloud/*`
   - Both HTTP and HTTPS

## Testing After Files Are Added

### Android
```bash
# Test that the file is accessible
curl https://dagster.cloud/.well-known/assetlinks.json

# Test deep link (should open app automatically)
adb shell am start -a android.intent.action.VIEW -d "https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__/sensors/sensor_name"
```

### iOS
```bash
# Test that the file is accessible
curl https://dagster.cloud/.well-known/apple-app-site-association

# Test deep link (should open app automatically)
xcrun simctl openurl booted "https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__/sensors/sensor_name"
```

## Important Notes

1. **File must be served with correct content-type:**
   - `assetlinks.json`: `application/json`
   - `apple-app-site-association`: `application/json` (or `application/pkcs7-mime` for signed files)

2. **File must be accessible without authentication** (no login required)

3. **HTTPS required** - Both files must be served over HTTPS

4. **Wildcard support:** If Dagster+ supports wildcard subdomains, they can use `*.dagster.cloud` in the file paths. Otherwise, they may need to add the files to each subdomain.

5. **Multiple apps:** If Dagster+ wants to support multiple mobile apps, they can add multiple entries to the arrays in both files.

## Current Status

- ✅ App is configured to handle deep links
- ✅ URL parser supports both `*.dagster.cloud` and `dagster.cloud` formats
- ❌ Verification files don't exist yet (need Dagster+ to add them)
- ⚠️ Deep links currently show "Open with" dialog (won't open automatically until files are added)

## Alternative: If Dagster+ Can't Add Files

If Dagster+ cannot add these files, the app will still work but:
- Users will see an "Open with" dialog when clicking links
- Users can select "Dagster+ Mobile" from the dialog
- Users can set the app as default to skip the dialog in the future
- The "Share to App" feature in the app will still work

