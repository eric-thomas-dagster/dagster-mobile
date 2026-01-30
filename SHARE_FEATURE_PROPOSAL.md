# Share Feature Proposal

## Overview

Add a "Share" button to detail screens (Jobs, Assets, Runs, Sensors, Schedules) that allows users to share Dagster+ web URLs with other team members via native sharing (SMS, Email, Slack, etc.).

## What's Possible

### 1. Native Share Sheet (Recommended)

**How it works:**
- User taps "Share" button on a detail screen
- Native share sheet appears (iOS/Android)
- User can share via:
  - SMS/Text messages
  - Email
  - Slack
  - WhatsApp
  - Copy to clipboard
  - Any other app that supports sharing

**Implementation:**
- Use `expo-sharing` (already in dependencies) or React Native's `Share` API
- Generate Dagster+ web URL from current screen data
- Optionally include a message like "Check out this asset: [URL]"

**Example:**
```typescript
import { Share } from 'react-native';

const shareUrl = `https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/assets/my_asset`;
const message = `Check out this asset: ${shareUrl}`;

Share.share({
  message: message,
  url: shareUrl, // iOS only
  title: 'Dagster+ Asset' // Android only
});
```

### 2. Where to Add Share Buttons

**Detail Screens:**
- **Job Detail Screen**: Share job URL
- **Asset Detail Screen**: Share asset URL  
- **Run Detail Screen**: Share run URL
- **Automation Detail Screen**: Share sensor/schedule URL

**List Screens (Optional):**
- Share button in list item actions (long-press menu)
- Share multiple items at once?

### 3. URL Generation

**Current URL patterns:**
- Job: `https://[org].dagster.cloud/[deployment]/workspace/[workspace]/jobs/[job_name]`
- Asset: `https://[org].dagster.cloud/[deployment]/workspace/[workspace]/assets/[asset_path]`
- Run: `https://[org].dagster.cloud/[deployment]/workspace/[workspace]/runs/[run_id]`
- Sensor: `https://[org].dagster.cloud/[deployment]/workspace/[workspace]/sensors/[sensor_name]`
- Schedule: `https://[org].dagster.cloud/[deployment]/workspace/[workspace]/schedules/[schedule_name]`

**What we need:**
- Organization name (from settings)
- Deployment name (from current deployment)
- Workspace name (from settings or asset/job data)
- Resource identifier (name, path, or ID)

### 4. Share Content Options

**Option A: Just the URL**
```
https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/assets/my_asset
```

**Option B: URL with description**
```
Check out this asset: https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/assets/my_asset
```

**Option C: Rich message**
```
Asset: my_asset
Status: Healthy
Last Materialized: 2 hours ago

View details: https://hooli.dagster.cloud/data-eng-prod/workspace/__repository__/assets/my_asset
```

### 5. User Experience

**Flow:**
1. User views a job/asset/run/etc.
2. Taps "Share" icon (top right, similar to Dashboard)
3. Native share sheet appears
4. User selects app (Slack, Email, SMS, etc.)
5. URL is shared
6. Recipient clicks link → Opens in Dagster+ web (or mobile app if configured)

## Questions to Clarify

1. **What should be shared?**
   - Just the URL?
   - URL + description?
   - Rich message with details?

2. **Where should share buttons appear?**
   - Only on detail screens?
   - Also on list screens?
   - In action menus?

3. **What information to include?**
   - Just the URL?
   - Resource name/description?
   - Current status?
   - Last materialization time?

4. **Share format:**
   - Plain URL?
   - URL with context message?
   - Formatted message with details?

5. **Multiple items:**
   - Should users be able to share multiple assets/jobs at once?
   - Or just one at a time?

## Implementation Details

### Required Data

For each screen, we need to construct the Dagster+ URL:

**Job Detail:**
- Organization: From settings
- Deployment: From current deployment
- Workspace: From job data or settings
- Job name: From job data

**Asset Detail:**
- Organization: From settings
- Deployment: From current deployment
- Workspace: From asset data or settings
- Asset path: From asset key

**Run Detail:**
- Organization: From settings
- Deployment: From current deployment
- Workspace: From run data or settings
- Run ID: From run data

**Sensor/Schedule Detail:**
- Organization: From settings
- Deployment: From current deployment
- Workspace: From automation data or settings
- Name: From automation data

### Code Structure

```typescript
// lib/utils/shareUtils.ts
export const generateDagsterUrl = (
  type: 'job' | 'asset' | 'run' | 'sensor' | 'schedule',
  identifier: string | string[],
  organization: string,
  deployment: string,
  workspace: string
): string => {
  // Generate URL based on type
};

// In each detail screen:
const handleShare = () => {
  const url = generateDagsterUrl(...);
  Share.share({ message: url });
};
```

## Benefits

- ✅ Easy way to share Dagster+ resources with team
- ✅ Works with any app that supports sharing
- ✅ Recipients can open in web or mobile app
- ✅ No special setup required
- ✅ Native platform integration

## Considerations

- Need to ensure we have all required data (org, deployment, workspace)
- URLs should match Dagster+ web format exactly
- Consider error handling if data is missing
- Should work offline (generate URL from cached data)

## Next Steps

Once you confirm this is what you want:
1. Create URL generation utility
2. Add share buttons to detail screens
3. Test with various sharing apps
4. Handle edge cases (missing data, etc.)

