# Intent Filters vs App Links: What Works Offline?

## You're Right! Basic Deep Linking Works Offline

**Intent filters work without internet connection!** When you click a link that matches your app's intent filters, Android will show the "Open with" dialog (or open your app if it's set as default) - **no internet needed**.

## Two Different Systems

### 1. Intent Filters (Works Offline ✅)

**What it is:**
- Android's basic deep linking system
- Works by matching URL patterns in your `app.json`
- **No internet connection required**
- Shows "Open with" dialog (or opens directly if app is set as default)

**How it works:**
```
User clicks link → Android checks installed apps → Finds apps with matching intent filters → Shows "Open with" dialog
```

**Your current config:**
```json
{
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": false,  // ← This means "don't verify domain"
      "data": [
        {
          "scheme": "https",
          "host": "*.dagster.cloud"
        }
      ]
    }
  ]
}
```

**This already works!** When you click a Dagster+ link:
- ✅ Works offline
- ✅ Shows "Open with" dialog
- ✅ Your app appears in the list
- ✅ User can select your app
- ✅ User can set your app as default

### 2. App Links (Requires Internet for Verification ❌)

**What it is:**
- Android's automatic deep linking system
- Requires domain verification files on the internet
- **Needs internet connection** to verify the domain
- Opens app automatically (no dialog)

**How it works:**
```
User clicks link → Android checks domain verification file online → If verified, opens app automatically
```

**What changes:**
```json
{
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,  // ← This means "verify domain online"
      "data": [...]
    }
  ]
}
```

**This requires:**
- ❌ Internet connection (to verify domain)
- ❌ Verification files on `dagster.cloud`
- ✅ But then opens app automatically (no dialog)

## Why the Verification Files?

The verification files (`assetlinks.json`) are **only needed for automatic opening without the dialog**.

**Without verification files:**
- ✅ Intent filters work (offline)
- ✅ "Open with" dialog appears
- ✅ User can select your app
- ⚠️ User sees a dialog every time (unless they set your app as default)

**With verification files:**
- ✅ Intent filters work (offline)
- ✅ App opens automatically (no dialog)
- ✅ Better user experience
- ⚠️ Requires internet for initial verification (then cached)

## What Happens When You Click a Link

### Current Setup (autoVerify: false)

**With internet:**
1. User clicks `https://dagster.cloud/...` link
2. Android checks installed apps for matching intent filters
3. Finds your app (matches `*.dagster.cloud`)
4. Shows "Open with" dialog
5. User selects "Dagster+ Mobile"
6. App opens ✅

**Without internet:**
1. User clicks `https://dagster.cloud/...` link
2. Android checks installed apps for matching intent filters
3. Finds your app (matches `*.dagster.cloud`)
4. Shows "Open with" dialog
5. User selects "Dagster+ Mobile"
6. App opens ✅

**Same behavior!** Works offline.

### With Verification Files (autoVerify: true)

**With internet (first time):**
1. User clicks `https://dagster.cloud/...` link
2. Android checks domain verification file online
3. Verifies your app is authorized
4. Opens app automatically (no dialog) ✅
5. Caches verification result

**Without internet (first time):**
1. User clicks `https://dagster.cloud/...` link
2. Android tries to check domain verification file
3. Can't reach internet
4. Falls back to "Open with" dialog
5. User selects app

**Without internet (after verification cached):**
1. User clicks link
2. Android uses cached verification
3. Opens app automatically ✅

## The Key Difference

| Feature | Intent Filters (autoVerify: false) | App Links (autoVerify: true) |
|---------|-----------------------------------|----------------------------|
| Works offline | ✅ Yes | ⚠️ Needs internet for verification |
| Shows dialog | ✅ Yes | ❌ No (opens automatically) |
| Needs domain files | ❌ No | ✅ Yes |
| User experience | ⚠️ User must select app | ✅ Seamless (auto-opens) |

## Your Current Situation

You said clicking links in email opens your app - this means:

1. **Intent filters are working!** ✅
2. You're either:
   - Seeing the "Open with" dialog and selecting your app
   - OR you've set your app as the default handler
3. **This works offline** - no verification files needed!

## When Do You Need Verification Files?

You only need verification files if you want:
- **Automatic opening** (no dialog)
- **Better user experience** (seamless)
- **To work like official apps** (Gmail, Twitter, etc.)

But if you're okay with:
- Users seeing "Open with" dialog (or setting your app as default)
- Basic deep linking functionality

Then you **don't need the verification files** - your current setup works!

## Summary

- ✅ **Intent filters work offline** - no internet needed
- ✅ **Your app already works** with email links
- ✅ **Verification files are optional** - only needed for automatic opening
- ✅ **Current setup is fine** if you don't mind the dialog

The verification files are a "nice to have" for better UX, not a requirement for basic deep linking!

