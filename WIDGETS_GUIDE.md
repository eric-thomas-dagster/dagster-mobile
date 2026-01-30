# Home Screen Widgets Implementation Guide

## Overview

Home screen widgets allow users to view key Dagster+ metrics directly on their device's home screen without opening the app. This provides quick status checks and improves user engagement.

## Current Status

**⚠️ Important**: Home screen widgets require native code and are not fully supported in Expo's managed workflow. To implement widgets, you'll need to:

1. Use **EAS Build** (recommended) or eject to a bare workflow
2. Add native widget extensions for iOS and Android
3. Use a config plugin or custom native modules

## Implementation Options

### Option 1: EAS Build with Config Plugin (Recommended)

This approach allows you to stay in the Expo managed workflow while adding native widget support.

#### Steps:

1. **Install widget dependencies**:
   ```bash
   npx expo install expo-widgets  # If available
   # OR use a community package like @bittingz/expo-widgets
   ```

2. **Create widget configuration** in `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-widgets",
           {
             "ios": {
               "widgetExtensionBundleId": "com.dagster.mobile.widget"
             },
             "android": {
               "widgetPackage": "com.dagster.mobile.widget"
             }
           }
         ]
       ]
     }
   }
   ```

3. **Build with EAS**:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### Option 2: Custom Native Modules

For more control, you can create custom native modules:

#### iOS Widget (WidgetKit)

1. Create a Widget Extension in Xcode
2. Implement `TimelineProvider` to fetch data
3. Use `SharedUserDefaults` or `App Groups` to share data between app and widget
4. Design widget UI with SwiftUI

#### Android Widget (App Widgets)

1. Create a `WidgetProvider` class
2. Implement `RemoteViews` for widget layout
3. Use `SharedPreferences` or a database to share data
4. Update widget with `AppWidgetManager`

## Widget Data Strategy

Since widgets run in a separate process, you'll need to:

1. **Cache data locally** that widgets can access
2. **Use background tasks** to refresh widget data
3. **Share data** between app and widget using:
   - iOS: App Groups / Shared UserDefaults
   - Android: SharedPreferences / Room Database

## Recommended Widget Types

### 1. **Run Status Widget**
- Shows recent run statuses
- Quick success/failure indicators
- Tap to open app to run details

### 2. **Key Metrics Widget**
- Materialization success rate
- Active runs count
- Failed runs count
- Tap to open Insights screen

### 3. **Asset Health Widget**
- Critical asset status
- Health indicators (healthy/degraded/warning)
- Tap to open asset details

### 4. **Job Status Widget**
- Scheduled job status
- Next run time
- Last run result

## Implementation Steps (Future)

1. **Set up data caching**:
   - Cache key metrics in AsyncStorage/SecureStore
   - Update cache on app launch and background refresh

2. **Create widget extension**:
   - iOS: WidgetKit extension
   - Android: App Widget provider

3. **Implement data sharing**:
   - iOS: App Groups
   - Android: SharedPreferences

4. **Design widget layouts**:
   - Small (2x2)
   - Medium (4x2)
   - Large (4x4)

5. **Add widget configuration**:
   - Allow users to choose which metrics to display
   - Support multiple widget instances

## Resources

- [Expo App Extensions](https://docs.expo.dev/versions/latest/sdk/app-extensions/)
- [iOS WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Android App Widgets](https://developer.android.com/develop/ui/views/appwidgets)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## Notes

- Widgets have limited update frequency (iOS: ~15 min, Android: ~30 min)
- Widgets cannot directly access network - must use cached data
- Consider using background fetch to keep widget data fresh
- Widgets are read-only - all actions must open the app

---

**Status**: This feature requires native development and is not yet implemented. Consider this a roadmap item for future development.

