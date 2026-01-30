export type AlertType =
  | 'JOB_FAILURE'
  | 'JOB_SUCCESS'
  | 'ASSET_FAILURE'
  | 'ASSET_SUCCESS'
  | 'ANY_JOB_FAILURE'
  | 'ASSET_CHECK_ERROR';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  targetId?: string; // job name, asset key path joined with '/', etc.
  targetName?: string; // Display name for the target
  enabled: boolean;
  createdAt: number;
  lastChecked?: number;
  lastTriggered?: number;
  lastTriggeredRunId?: string; // To avoid duplicate notifications
}

export interface AlertNotification {
  id: string;
  alertId: string;
  alertName: string;
  type: AlertType;
  targetName?: string;
  triggeredAt: number;
  runId?: string;
  assetKey?: string[];
  message: string;
  read: boolean;
}

export interface AlertEvaluationResult {
  shouldTrigger: boolean;
  runId?: string;
  assetKey?: string[];
  message: string;
}
