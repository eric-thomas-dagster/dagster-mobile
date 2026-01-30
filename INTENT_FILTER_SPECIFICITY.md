# Intent Filter Specificity: Why Your App Only Handles Dagster+ Links

## Good News: Your App is Configured Correctly!

Your intent filters are **specific to Dagster+ domains only**. The app will **NOT** try to handle all HTTPS links.

## How Intent Filters Work

Android matches intent filters based on **all** the criteria you specify:
- Scheme (https/http)
- Host (domain)
- Path prefix (optional)

**Your current configuration:**
```json
{
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": false,
      "data": [
        {
          "scheme": "https",
          "host": "*.dagster.cloud",  // ← Only matches dagster.cloud subdomains
          "pathPrefix": "/"
        },
        {
          "scheme": "https",
          "host": "dagster.cloud",     // ← Only matches dagster.cloud directly
          "pathPrefix": "/"
        }
      ]
    }
  ]
}
```

## What This Means

### ✅ Your App WILL Handle:
- `https://hooli.dagster.cloud/...`
- `https://dagster.cloud/...`
- `https://*.dagster.cloud/...` (any subdomain)
- `http://dagster.cloud/...` (HTTP version)

### ❌ Your App WILL NOT Handle:
- `https://google.com/...`
- `https://github.com/...`
- `https://example.com/...`
- Any other HTTPS link that's not dagster.cloud

## Setting as Default

When you set your app as default for Dagster+ links:
- ✅ Only applies to `*.dagster.cloud` and `dagster.cloud` links
- ✅ Other HTTPS links will still open in Chrome/browser normally
- ✅ Your app won't interfere with other websites

## How Android Determines Which App to Use

When you click a link, Android:
1. Checks the URL: `https://hooli.dagster.cloud/...`
2. Looks for apps with matching intent filters
3. Finds your app (matches `*.dagster.cloud`)
4. Shows "Open with" dialog OR opens your app if set as default

When you click a different link: `https://google.com/...`
1. Checks the URL: `https://google.com/...`
2. Looks for apps with matching intent filters
3. Your app doesn't match (not `*.dagster.cloud`)
4. Opens in Chrome/browser normally

## Testing This

You can verify this works correctly:

```bash
# This SHOULD show your app in "Open with" dialog
adb shell am start -a android.intent.action.VIEW -d "https://dagster.cloud/test"

# This should NOT show your app (opens in browser)
adb shell am start -a android.intent.action.VIEW -d "https://google.com"
```

## Why This is Safe

1. **Intent filters are domain-specific** - Android only matches exact host patterns
2. **Wildcard only applies to subdomains** - `*.dagster.cloud` only matches subdomains of dagster.cloud
3. **Setting as default is per-domain** - Default handler is specific to the matched domain pattern
4. **Your app code validates URLs** - Even if a link somehow got through, your URL parser would reject non-Dagster URLs

## Summary

- ✅ Your app only handles `*.dagster.cloud` and `dagster.cloud` links
- ✅ Setting as default only affects Dagster+ links
- ✅ Other HTTPS links will work normally
- ✅ No risk of your app trying to open all HTTPS links

You're safe to set it as default! It will only apply to Dagster+ links.

