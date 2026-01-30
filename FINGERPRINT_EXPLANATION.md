# Why Your App Fingerprint Doesn't Change When You Update

## The Key Point

**The SHA-256 fingerprint comes from your signing certificate/keystore, NOT from your app code or files.**

## How It Works

### 1. The Fingerprint is From Your Keystore

When you build your app, you sign it with a keystore (a certificate file). The SHA-256 fingerprint is calculated from that certificate, not from your app's code.

```
Your App Code → Build → Sign with Keystore → APK
                                    ↓
                            Certificate Fingerprint
                            (stays the same!)
```

### 2. Same Keystore = Same Fingerprint

- **First build:** Sign with keystore → Fingerprint: `ABC123...`
- **Update app code:** Sign with **same keystore** → Fingerprint: `ABC123...` (unchanged!)
- **Another update:** Sign with **same keystore** → Fingerprint: `ABC123...` (still the same!)

As long as you use the **same keystore** to sign all your app updates, the fingerprint stays the same.

### 3. EAS Build Uses the Same Keystore

When you use EAS Build:
- EAS stores your keystore securely
- Every build uses the **same keystore**
- Therefore, every build has the **same fingerprint**
- The `assetlinks.json` file on `dagster.cloud` will work for all your app updates

## Why Old Apps Still Work

If you click a link in email and it opens your app (even an old version), it's because:

1. **The fingerprint matches:** Your old app was signed with the same keystore, so it has the same fingerprint
2. **The verification file recognizes it:** The `assetlinks.json` file on `dagster.cloud` contains your fingerprint, so Android recognizes your app (old or new) as authorized
3. **Android checks the certificate, not the app version:** Android verifies that the app trying to handle the link was signed with a certificate matching the fingerprint in `assetlinks.json`

## What Would Change the Fingerprint?

The fingerprint would ONLY change if:

1. **You create a new keystore** (don't do this unless you have to!)
2. **You use a different keystore** for a build
3. **You lose your keystore and create a new one** (this would break deep linking!)

## Best Practice

- **Keep your keystore safe** - EAS Build does this for you automatically
- **Use the same keystore for all builds** - EAS Build does this automatically
- **The fingerprint in `assetlinks.json` will work forever** (as long as you keep using the same keystore)

## Example Timeline

```
Day 1: Build v1.0 → Sign with keystore → Fingerprint: ABC123
       Dagster+ adds assetlinks.json with fingerprint ABC123
       ✅ Deep linking works!

Day 30: Update code, build v1.1 → Sign with SAME keystore → Fingerprint: ABC123
        ✅ Deep linking still works! (same fingerprint)

Day 60: Update code, build v2.0 → Sign with SAME keystore → Fingerprint: ABC123
        ✅ Deep linking still works! (same fingerprint)

Day 90: Accidentally create new keystore, build v2.1 → Sign with NEW keystore → Fingerprint: XYZ789
        ❌ Deep linking breaks! (fingerprint changed, doesn't match assetlinks.json)
```

## If You Need to Change Keystores

If you ever need to change your keystore (e.g., you lost it, or need to rotate keys):

1. **Get the new fingerprint** from the new keystore
2. **Contact Dagster+** to update `assetlinks.json` with the new fingerprint
3. **Both old and new fingerprints can coexist** in the file (for a transition period)

The `assetlinks.json` file can contain multiple entries:
```json
[
  {
    "package_name": "com.dagster.mobile",
    "sha256_cert_fingerprints": [
      "ABC123...",  // Old keystore
      "XYZ789..."   // New keystore
    ]
  }
]
```

## Summary

- ✅ **Fingerprint = Certificate, not app code**
- ✅ **Same keystore = Same fingerprint forever**
- ✅ **App updates don't change the fingerprint**
- ✅ **Old apps work because they use the same certificate**
- ✅ **EAS Build keeps your keystore safe and consistent**

