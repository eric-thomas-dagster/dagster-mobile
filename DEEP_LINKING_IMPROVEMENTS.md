# Deep Linking Improvements Based on Expo Documentation

Based on the [Expo Linking documentation](https://docs.expo.dev/linking/into-your-app/), we've made the following improvements to URL handling:

## Current Implementation

### ✅ What We're Already Doing Correctly

1. **Custom URL Scheme**: Configured `scheme: "dagster-mobile"` in `app.json`
2. **Using expo-linking**: Using `Linking.getInitialURL()` and `Linking.addEventListener('url', callback)`
3. **URL Parsing**: Custom parser for Dagster+ URLs

### 🔧 Improvements Made

1. **Using `Linking.parse()`**: Now using Expo's built-in URL parser for better compatibility
   - Handles query parameters automatically
   - Properly extracts hostname, path, and query params
   - More robust than manual string parsing

2. **Enhanced Custom Scheme Handling**: 
   - Supports `dagster-mobile://https://...` format (full URL in custom scheme)
   - Supports `dagster-mobile://[path]` format (custom path format)
   - Automatically converts custom scheme URLs to HTTPS URLs when needed

3. **Better URL Normalization**:
   - Handles both HTTP and HTTPS
   - Properly reconstructs URLs from parsed components
   - More resilient to different URL formats

## How It Works Now

### Custom URL Scheme (`dagster-mobile://`)

The app can handle custom scheme URLs in multiple formats:

1. **Full URL in scheme**: `dagster-mobile://https://hooli.dagster.cloud/...`
   - Automatically extracts the HTTPS URL
   - Processes it as a normal Dagster+ URL

2. **Path-based scheme**: `dagster-mobile://sensor/sensor_name`
   - Can be extended to support custom path formats
   - Currently falls back to HTTPS URL detection

3. **Direct HTTPS**: `https://hooli.dagster.cloud/...`
   - Works when domain verification files exist
   - Also works via intent filters (shows "Open with" dialog)

### URL Processing Flow

```
1. URL received (custom scheme or HTTPS)
   ↓
2. Parse with Linking.parse() (Expo's built-in parser)
   ↓
3. Extract hostname, path, query params
   ↓
4. If custom scheme, extract embedded URL
   ↓
5. Parse Dagster+ URL structure
   ↓
6. Navigate to appropriate screen
```

## Testing

### Test Custom Scheme

```bash
# Test with full URL in custom scheme
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name"

# Test with path format (if implemented)
adb shell am start -a android.intent.action.VIEW -d "dagster-mobile://sensor/sensor_name"
```

### Test HTTPS URL

```bash
# Test HTTPS URL (will show "Open with" dialog if intent filters work)
adb shell am start -a android.intent.action.VIEW -d "https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__@hooli_airlift/sensors/sensor_name"
```

## Limitations (Still Apply)

1. **Universal Links/App Links**: Still require domain verification files from Dagster+
2. **Slack Integration**: Slack may not show "Open with" dialog in web view
3. **Automatic Opening**: Won't work automatically without domain verification

## Workarounds

1. **Share to App Feature**: Users can copy URLs and use the Share button
2. **Intent Filters**: App appears in "Open with" dialog (when supported)
3. **Custom Scheme Links**: Can be shared/generated for direct app opening

## Future Enhancements

1. **Browser Extension**: Convert HTTPS URLs to custom scheme URLs
2. **Bookmarklet**: JavaScript bookmark to convert URLs on Dagster+ pages
3. **Share Intent**: Handle Android share intents directly
4. **URL Shortener**: Create a service that redirects to custom scheme URLs

## References

- [Expo Linking Documentation](https://docs.expo.dev/linking/into-your-app/)
- [Android App Links](https://docs.expo.dev/linking/android-app-links/)
- [iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/)

