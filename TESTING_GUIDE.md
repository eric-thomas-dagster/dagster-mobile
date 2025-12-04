# Testing Guide for Dagster+ Mobile App

## Quick Start with Expo Go

### Prerequisites
- ✅ Expo Go app installed on your phone (iOS or Android)
- ✅ Your phone and computer on the same Wi-Fi network
- ✅ Node.js installed (v16 or higher)
- ✅ npm or yarn installed

### Step 1: Navigate to Project Directory

```bash
cd dagster-mobile
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Start the Expo Development Server

```bash
npm start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code in your terminal

### Step 4: Connect Your Phone

#### Option A: Scan QR Code (Recommended)

**iOS:**
1. Open the **Camera** app on your iPhone
2. Point it at the QR code in your terminal
3. Tap the notification that appears
4. Expo Go will open automatically

**Android:**
1. Open the **Expo Go** app on your Android device
2. Tap "Scan QR code"
3. Point your camera at the QR code in your terminal

#### Option B: Use Expo Go Directly

1. Open **Expo Go** app on your phone
2. Make sure your phone and computer are on the same Wi-Fi network
3. The app should appear in the "Recently opened" section if you've used it before
4. Or tap "Enter URL manually" and enter the URL shown in your terminal (e.g., `exp://192.168.1.100:8081`)

### Step 5: Wait for App to Load

- The first time may take a minute or two as it bundles the app
- You'll see a loading screen, then the app will appear
- If you see errors, check the terminal for details

## Troubleshooting

### "Unable to connect to Metro bundler"

**Solution:**
1. Make sure your phone and computer are on the same Wi-Fi network
2. Check your firewall isn't blocking port 8081
3. Try restarting the Expo server: `npm start -- --clear`

### "Network response timed out"

**Solution:**
1. Check your Wi-Fi connection
2. Try using your computer's IP address directly
3. Restart the Expo server

### App won't load / Stuck on loading screen

**Solution:**
1. Close Expo Go completely and reopen it
2. Clear the Expo Go cache (in app settings)
3. Restart the development server: `npm start -- --clear`
4. Make sure you're using the latest version of Expo Go

### Changes not appearing

**Solution:**
1. Shake your device to open the developer menu
2. Tap "Reload" or press `r` in the terminal
3. Or enable "Fast Refresh" in Expo Go settings

## Development Commands

### Start Development Server
```bash
npm start
```

### Start with Clear Cache
```bash
npm start -- --clear
```

### Start for Specific Platform
```bash
npm run ios      # iOS simulator (Mac only)
npm run android  # Android emulator
npm run web      # Web browser
```

### Open Developer Menu

**On Device:**
- **iOS**: Shake device or use 3-finger tap
- **Android**: Shake device or press menu button

**In Terminal:**
- Press `r` to reload
- Press `m` to toggle menu
- Press `j` to open debugger

## Testing Checklist

### Basic Functionality
- [ ] App launches successfully
- [ ] Can navigate between tabs (Home, Catalog, Jobs, Runs, Automations)
- [ ] Settings screen is accessible and scrollable
- [ ] Can configure API settings
- [ ] Can test connection
- [ ] Dark mode toggle works

### Data Display
- [ ] Dashboard shows recent runs
- [ ] Jobs list displays correctly
- [ ] Runs list displays correctly
- [ ] Assets list displays correctly
- [ ] Automations list displays correctly
- [ ] Long names truncate properly (don't overflow)

### Navigation
- [ ] Can navigate to detail screens
- [ ] Back button works
- [ ] Can navigate from Jobs to Job Details
- [ ] Can navigate from Runs to Run Details
- [ ] Can navigate from Assets to Asset Details

### Settings
- [ ] Settings page scrolls to bottom
- [ ] Can access "App Preferences" section
- [ ] Can toggle auto-refresh
- [ ] Can toggle notifications
- [ ] Can toggle dark mode
- [ ] Can save settings
- [ ] Can reset settings

### UI/UX
- [ ] Text doesn't overflow containers
- [ ] Status badges display correctly
- [ ] Cards are properly styled
- [ ] Pull-to-refresh works
- [ ] Search functionality works
- [ ] Filters work correctly

## Tips for Testing

1. **Test on Real Device**: Always test on a real device, not just simulator/emulator
2. **Test Different Screen Sizes**: If possible, test on different phone sizes
3. **Test Both Themes**: Switch between light and dark mode
4. **Test Network Conditions**: Try with slow network or airplane mode
5. **Test Edge Cases**: 
   - Very long names
   - Empty states
   - Error states
   - No data scenarios

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Issue: TypeScript errors

**Solution:**
```bash
# Check if TypeScript is installed
npm install --save-dev typescript @types/react @types/react-native
```

### Issue: Metro bundler crashes

**Solution:**
```bash
# Clear watchman cache (if installed)
watchman watch-del-all

# Clear Metro cache
npm start -- --clear

# Reset Metro bundler
rm -rf node_modules/.cache
```

## Next Steps

Once testing is complete:
1. Fix any bugs found
2. Test on both iOS and Android if possible
3. Test with real Dagster+ instance data
4. Document any issues found
5. Consider building a standalone app for distribution

## Building for Distribution

When ready to build a standalone app:

```bash
# For Android APK
eas build --platform android --profile preview --local

# For iOS (requires Mac and Apple Developer account)
eas build --platform ios --profile preview
```

See `eas.json` for build configuration.

