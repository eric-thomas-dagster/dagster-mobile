# Troubleshooting: "Open With" Dialog Not Appearing

If you're not seeing the "Open with" dialog when clicking Dagster+ links, here are the most common causes and solutions:

## Common Causes

### 1. Chrome is Set as Default Handler

**Problem:** Chrome (or another browser) is set as the default handler for HTTPS links, so Android opens links directly in Chrome without showing a dialog.

**Solution:**
1. Go to **Settings → Apps → Chrome** (or your default browser)
2. Tap **Open by default** or **Set as default**
3. Tap **Clear defaults** or **Don't open in this app**
4. Now when you click a Dagster+ link, you should see the "Open with" dialog

### 2. Slack Uses WebView (Doesn't Trigger Intents)

**Problem:** Slack's in-app browser (WebView) may not properly trigger Android's intent system, so the dialog doesn't appear.

**Solution:**
- Click the "Open in browser" option in Slack (usually three dots menu)
- This will open the link in Chrome, which should then trigger the intent
- Or copy the link and paste it into Chrome/another app

### 3. Email App Behavior

**Problem:** Some email apps (like Gmail) handle links in their own WebView, which may not trigger intents properly.

**Solution:**
- Try long-pressing the link and selecting "Open in browser"
- Or copy the link and paste it into Chrome

### 4. Intent Filters Not Working

**Problem:** The intent filters might not be matching the URL pattern correctly.

**Test this:**
```bash
# Test from command line (should show dialog)
adb shell am start -a android.intent.action.VIEW -d "https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__/sensors/test"
```

If this doesn't show the dialog, the intent filters might not be configured correctly.

### 5. App Not Installed or Not Recognized

**Problem:** Android might not recognize your app as a handler.

**Solution:**
- Make sure the app is installed
- Uninstall and reinstall the app (this refreshes the intent filter registration)
- Restart your device

## Testing Steps

### Step 1: Clear Browser Defaults

1. Settings → Apps → Chrome
2. Open by default → Clear defaults
3. Try clicking a link again

### Step 2: Test from Command Line

```bash
# This should show "Open with" dialog
adb shell am start -a android.intent.action.VIEW -d "https://dagster.cloud/hooli/data-eng-prod/workspace/__repository__/sensors/test"
```

If this works, the intent filters are correct, but something else is intercepting the links.

### Step 3: Test from Different Apps

Try clicking the same link from:
- Chrome (should show dialog if defaults cleared)
- Gmail (might not work due to WebView)
- Slack (might not work due to WebView)
- A text message (should work)

### Step 4: Check App Installation

```bash
# Verify app is installed and registered
adb shell pm list packages | grep dagster
adb shell dumpsys package com.dagster.mobile | grep -A 10 "Activity"
```

## Why It Might Not Work in Slack/Email

Many apps (Slack, Gmail, etc.) use WebViews to display links. WebViews don't always trigger Android's intent system properly. This is a limitation of how those apps work, not your app.

**Workarounds:**
1. Use "Open in browser" option in Slack/Gmail
2. Copy link and paste into Chrome
3. Use the "Share to App" feature in your app
4. Set your app as default handler (if possible)

## Making It Work Better

### Option 1: Set App as Default (If Possible)

When the "Open with" dialog appears:
1. Select "Dagster+ Mobile"
2. Check "Always use this app"
3. Future links will open directly in your app

### Option 2: Use Custom URL Scheme

Instead of relying on HTTPS links, you could:
1. Create a URL shortener service
2. Convert `https://dagster.cloud/...` to `dagster-mobile://...`
3. Share the custom scheme link
4. Your app handles the custom scheme (works more reliably)

### Option 3: Share Intent Handler

Add a share intent handler to your app so users can share Dagster+ links directly to your app from any app.

## Current Configuration Check

Your `app.json` has:
```json
{
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": false,
      "data": [
        {
          "scheme": "https",
          "host": "*.dagster.cloud"
        },
        {
          "scheme": "https",
          "host": "dagster.cloud"
        }
      ]
    }
  ]
}
```

This should work, but:
- `*.dagster.cloud` might not match correctly in all cases
- You might need to rebuild the app after changing intent filters
- Android might have cached the old configuration

## Next Steps

1. **Clear Chrome defaults** and test
2. **Test from command line** to verify intent filters work
3. **Rebuild the app** if intent filters were recently changed
4. **Test from different apps** to see which ones trigger the dialog

Let me know what happens when you test from the command line - that will tell us if the intent filters are working at all!

