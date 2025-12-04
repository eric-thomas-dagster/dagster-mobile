# Expo Go Troubleshooting Guide

## Issue: "Something went wrong" or App Won't Open

### Step 1: Verify Expo Server is Running

Check if the Metro bundler is running:

```bash
# In the dagster-mobile directory
npm start
```

You should see:
- A QR code in the terminal
- "Metro waiting on exp://..."
- No error messages

### Step 2: Check Network Connection

**Critical**: Your phone and computer MUST be on the same Wi-Fi network.

1. Check your computer's IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or check in System Preferences > Network
   ```

2. Verify your phone is on the same network:
   - Go to phone Settings > Wi-Fi
   - Make sure it's connected to the same network as your computer

### Step 3: Try Different Connection Methods

#### Option A: Use Tunnel Mode (Recommended if Wi-Fi issues)
```bash
npm start -- --tunnel
```

This uses Expo's servers to connect, bypassing local network issues.

#### Option B: Use LAN Mode Explicitly
```bash
npm start -- --lan
```

#### Option C: Enter URL Manually
1. In Expo Go app, tap "Enter URL manually"
2. Look at your terminal for the URL (e.g., `exp://192.168.1.100:8081`)
3. Enter it manually

### Step 4: Clear Cache and Restart

```bash
# Stop the current server (Ctrl+C)
# Then restart with cleared cache
npm start -- --clear
```

Also clear Expo Go cache:
- **iOS**: Settings > Expo Go > Clear Cache
- **Android**: Settings > Apps > Expo Go > Storage > Clear Cache

### Step 5: Check for Error Messages

Look in the terminal for:
- Red error messages
- "Unable to resolve module" errors
- Port conflicts
- Network errors

### Step 6: Verify Dependencies

Some packages might not work in Expo Go. Check if you have any incompatible packages:

```bash
npm list --depth=0
```

Common issues:
- Custom native modules require development builds
- Some packages need `expo-dev-client` instead of Expo Go

### Step 7: Check App Entry Point

Verify `app.json` has correct configuration:
- `main` field points to correct entry file
- No syntax errors in JSON

### Step 8: Try Web Version First

Test if the app works in browser:
```bash
npm run web
```

If web works but mobile doesn't, it's likely a network/connection issue.

## Common Error Messages

### "Unable to connect to Metro bundler"
- **Fix**: Check firewall, ensure same Wi-Fi, try tunnel mode

### "Network response timed out"
- **Fix**: Check internet connection, restart server, try tunnel mode

### "Unable to resolve module"
- **Fix**: Run `npm install`, check for missing dependencies

### "Something went wrong"
- **Fix**: Check terminal for specific errors, clear cache, restart

## Quick Fix Checklist

1. ✅ Expo server is running (`npm start`)
2. ✅ Phone and computer on same Wi-Fi
3. ✅ Expo Go app is up to date
4. ✅ Cleared cache (`npm start -- --clear`)
5. ✅ No error messages in terminal
6. ✅ Tried tunnel mode (`npm start -- --tunnel`)

## Alternative: Use Development Build

If Expo Go continues to have issues, you can create a development build:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Build development client
eas build --profile development --platform android --local
```

This creates an APK you can install directly (like you did before).

## Still Not Working?

1. Check the terminal output for specific errors
2. Check Expo Go app logs (shake device > "Show Dev Menu" > "View Logs")
3. Try on a different device
4. Try on iOS if you're on Android (or vice versa)
5. Check Expo status: https://status.expo.dev

