export interface AssetKey {
  path: string[];
}

export interface MetadataEntry {
  label: string;
  description?: string;
  type: string;
}

export interface TextMetadataEntry extends MetadataEntry {
  type: 'text';
  text: string;
}

export interface IntMetadataEntry extends MetadataEntry {
  type: 'int';
  intValue: number;
}

export interface FloatMetadataEntry extends MetadataEntry {
  type: 'float';
  floatValue: number;
}

export interface BoolMetadataEntry extends MetadataEntry {
  type: 'bool';
  boolValue: boolean;
}

export interface AssetTag {
  key: string;
  value: string;
}

export interface AssetOwner {
  __typename: string;
  team?: string;
  email?: string;
}

export interface CodeLocation {
  repositoryName: string;
  repositoryLocationName: string;
}

export interface ColumnTag {
  key: string;
  value: string;
}

export interface AssetNode {
  id: string;
  assetKey: AssetKey;
  opVersion?: string;
  jobNames?: string[];
  codeVersion?: string;
  groupName?: string;
  description?: string;
  isObservable?: boolean;
  isPartitioned?: boolean;
  metadataEntries?: MetadataEntry[];
}

export interface Column {
  name: string;
  type: string;
  tags?: AssetTag[];
}

export interface TableSchema {
  columns: Column[];
}

export interface MetadataEntry {
  __typename: string;
  label: string;
  description?: string;
  text?: string;
  schema?: TableSchema;
  table?: {
    name?: string;
    schema?: {
      columns?: Array<{
        name: string;
        tags?: string[];
      }>;
    };
  };
}

export interface MaterializationEvent {
  timestamp: string;
  assetKey: AssetKey;
  metadataEntries: (TextMetadataEntry | IntMetadataEntry | FloatMetadataEntry | BoolMetadataEntry)[];
}

export interface AssetMaterialization {
  timestamp: string;
  assetKey: AssetKey;
  metadataEntries: (TextMetadataEntry | IntMetadataEntry | FloatMetadataEntry | BoolMetadataEntry)[];
}

export interface AssetHealth {
  assetHealth: string;
  materializationStatus: string;
  assetChecksStatus: string;
  freshnessStatus: string;
}

export interface AssetDefinition {
  opName: string;
  description?: string;
  assetKey: AssetKey;
  groupName?: string;
  tags?: AssetTag[];
  metadataEntries?: MetadataEntry[];
}

export interface Asset {
  id: string;
  key: AssetKey;
  definition: AssetDefinition;
  assetMaterializations: AssetMaterialization[];
  assetHealth?: AssetHealth;
}

export interface AssetConnection {
  nodes: Asset[];
}

export interface AssetsOrError {
  __typename: 'AssetConnection';
  nodes: Asset[];
}

export interface JobState {
  status: string;
}

export interface Schedule {
  id: string;
  name: string;
  cronSchedule?: string;
  executionTimezone?: string;
}

export interface SensorState {
  status: string;
}

export interface Sensor {
  id: string;
  name: string;
  sensorState: SensorState;
}

export interface Job {
  id: string;
  name: string;
  description?: string;
  jobState: JobState;
  schedules: Schedule[];
  sensors: Sensor[];
}

export interface Jobs {
  results: Job[];
}

export interface JobsOrError {
  __typename: 'Jobs';
  results: Job[];
}

export interface RunStats {
  stepsSucceeded: number;
  stepsFailed: number;
  materializations: number;
  expectations: number;
}

export interface RunTag {
  key: string;
  value: string;
}

export interface Run {
  id: string;
  runId: string;
  status: string;
  startTime?: string;
  endTime?: string;
  pipelineName: string;
  tags: RunTag[];
  stats: RunStats;
}

export interface Runs {
  results: Run[];
}

export interface RunsOrError {
  __typename: 'Runs';
  results: Run[];
}

export interface Pipeline {
  name: string;
  description?: string;
}

export interface ExecutionStep {
  key: string;
  kind: string;
  inputs: {
    dependsOn: {
      solid: {
        name: string;
      };
    }[];
  }[];
  outputs: {
    solid: {
      name: string;
    };
  }[];
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
}

export interface DetailedRun extends Run {
  pipeline: Pipeline;
  executionPlan: ExecutionPlan;
}

export interface RepositoryLocation {
  id: string;
  name: string;
}

export interface RepositoryPipeline {
  id: string;
  name: string;
  description?: string;
}

export interface RepositoryJob {
  id: string;
  name: string;
  description?: string;
}

export interface RepositoryAsset {
  id: string;
  key: AssetKey;
}

export interface Repository {
  id: string;
  name: string;
  location: RepositoryLocation;
  pipelines: RepositoryPipeline[];
  jobs: RepositoryJob[];
  assets: RepositoryAsset[];
}

export interface RepositoryConnection {
  nodes: Repository[];
}

export interface RepositoriesOrError {
  __typename: 'RepositoryConnection';
  nodes: Repository[];
}

export interface RepositorySelector {
  repositoryName: string;
  repositoryLocationName: string;
}

export interface AssetKeyInput {
  path: string[];
}

// GraphQL Query Response Types
export interface GetAssetsResponse {
  assetsOrError: AssetsOrError;
}

export interface GetJobsResponse {
  jobsOrError: JobsOrError;
}

export interface GetRunsResponse {
  runsOrError: RunsOrError;
}

export interface GetRunResponse {
  runOrError: {
    __typename: 'Run';
  } & DetailedRun;
}

export interface GetRunLogsResponse {
  logsForRun: LogsForRunResult;
}

export interface GetRepositoriesResponse {
  repositoriesOrError: RepositoriesOrError;
}

export interface GetAssetResponse {
  assetOrError: {
    __typename: 'Asset';
  } & Asset;
}

// Run Status Types
export enum RunStatus {
  QUEUED = 'QUEUED',
  NOT_STARTED = 'NOT_STARTED',
  STARTING = 'STARTING',
  MANAGED = 'MANAGED',
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  CANCELED = 'CANCELED',
  CANCELING = 'CANCELING',
}

// Job Status Types
export enum JobStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  STOPPING = 'STOPPING',
}

// Log-related types
export interface LogMessageEvent {
  __typename: 'LogMessageEvent';
  message: string;
  timestamp: string;
  level: string;
  stepKey?: string;
}

export interface MaterializationEvent {
  __typename: 'MaterializationEvent';
  assetKey: {
    path: string[];
  };
  message: string;
  timestamp: string;
  level: string;
  stepKey?: string;
}

export type LogEvent = LogMessageEvent | MaterializationEvent;

export interface EventConnection {
  events: LogEvent[];
  cursor?: string;
  hasMore: boolean;
}

export interface RunNotFoundError {
  __typename: 'RunNotFoundError';
  message: string;
}

export interface PythonError {
  __typename: 'PythonError';
  message: string;
  stack: string[];
}

export type LogsForRunResult = EventConnection | RunNotFoundError | PythonError;

export interface DagsterCloudDeployment {
  deploymentName: string;
  organizationName: string;
}

export interface GetDeploymentsResponse {
  dagsterCloudDeployments: DagsterCloudDeployment[];
}

// New Schedule types for the schedulesOrError query
export interface ScheduleState {
  status: string;
}

export interface ScheduleResult {
  id: string;
  name: string;
  scheduleState: ScheduleState;
  cronSchedule?: string;
}

export interface Schedules {
  results: ScheduleResult[];
}

export interface GetSchedulesResponse {
  schedulesOrError: Schedules | PythonError;
}

// New Sensor types for the sensorsOrError query
export interface SensorState {
  status: string;
}

export interface SensorTarget {
  pipelineName: string;
}

export interface SensorResult {
  id: string;
  name: string;
  sensorState: SensorState;
  targets: SensorTarget[];
}

export interface Sensors {
  results: SensorResult[];
}

export interface GetSensorsResponse {
  sensorsOrError: Sensors | PythonError;
}

// Selector types for mutations
export interface SensorSelector {
  repositoryName: string;
  repositoryLocationName: string;
  sensorName: string;
}

export interface ScheduleSelector {
  repositoryName: string;
  repositoryLocationName: string;
  scheduleName: string;
}

// Mutation response types
export interface StartSensorResponse {
  startSensor: Sensor | UnauthorizedError | PythonError;
}

export interface StopSensorResponse {
  stopSensor: StopSensorMutationResult | UnauthorizedError | PythonError;
}

export interface StopSensorMutationResult {
  instigationState: InstigationState;
}

export interface InstigationState {
  id: string;
  selectorId: string;
  name: string;
  instigationType: string;
  status: string;
  runningCount: number;
}

export interface StartScheduleResponse {
  startSchedule: ScheduleMutationResult | UnauthorizedError | PythonError;
}

export interface StopScheduleResponse {
  resetSchedule: ScheduleMutationResult | UnauthorizedError | PythonError;
}

export interface ScheduleMutationResult {
  __typename: string;
}

export interface UnauthorizedError {
  message: string;
}

// Tick history types
export interface InstigationSelector {
  repositoryName: string;
  repositoryLocationName: string;
  name: string;
}

export interface InstigationTick {
  id: string;
  tickId: string;
  status: string;
  timestamp: number;
  endTimestamp?: number;
  cursor: string;
  instigationType: string;
  skipReason?: string;
  requestedAssetMaterializationCount: number;
  runIds: string[];
  runs: Array<{
    id: string;
    status: string;
  }>;
  originRunIds: string[];
  error?: {
    message: string;
    stack: string[];
  };
  logKey?: string;
}

export interface InstigationState {
  id: string;
  instigationType: string;
  ticks: InstigationTick[];
}

export interface TickHistoryResponse {
  instigationStateOrError: InstigationState | PythonError;
}

// Automation runs types
export interface RepositorySelector {
  repositoryName: string;
  repositoryLocationName: string;
}

export interface AutomationRun {
  id: string;
  runId: string;
  status: string;
  pipelineName: string;
  startTime?: number;
  endTime?: number;
  updateTime?: number;
  tags: Array<{
    key: string;
    value: string;
  }>;
}

export interface AutomationRunsResponse {
  pipelineRunsOrError: Runs | PythonError;
}

// Catalog View Types
export interface CatalogViewSelection {
  tags: Array<{
    key: string;
    value: string;
    __typename: string;
  }>;
  kinds: string[];
  owners: Array<{
    __typename: string;
    team?: string;
    email?: string;
  }>;
  groups: Array<{
    groupName: string;
    repositoryName: string;
    repositoryLocationName: string;
    __typename: string;
  }>;
  codeLocations: Array<{
    repositoryName: string;
    repositoryLocationName: string;
    __typename: string;
  }>;
  columns: string[];
  tableNames: string[];
  columnTags: Array<{
    key: string;
    value: string;
    __typename: string;
  }>;
  querySelection: string;
  __typename: string;
}

export interface CatalogView {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  icon?: string;
  isPrivate: boolean;
  selection: CatalogViewSelection;
  __typename: string;
}

export interface CatalogViewsResponse {
  catalogViews: CatalogView[];
}

export interface UserFavoriteAsset {
  path: string[];
  __typename: string;
}

export interface UserFavoriteAssetsResponse {
  userFavoriteAssets: UserFavoriteAsset[];
}

export interface SearchResults {
  assetKeys: {
    path: string[];
  }[];
}

export interface SearchAssetsResponse {
  search: SearchResults;
}

export interface AssetNode {
  assetKey: AssetKey;
  dependencies?: AssetDependency[];
  dependedBy?: AssetDependency[];
}

export interface AssetDependency {
  asset: {
    assetKey: AssetKey;
  };
}

export interface GetAssetDependenciesResponse {
  assetNodeOrError: AssetNode;
}

// Add missing types for catalog views and favorites
export interface CatalogViewSelection {
  tags: Array<{
    key: string;
    value: string;
    __typename: string;
  }>;
  kinds: string[];
  owners: Array<{
    __typename: string;
    team?: string;
    email?: string;
  }>;
  groups: Array<{
    groupName: string;
    repositoryName: string;
    repositoryLocationName: string;
    __typename: string;
  }>;
  codeLocations: Array<{
    repositoryName: string;
    repositoryLocationName: string;
    __typename: string;
  }>;
  columns: string[];
  tableNames: string[];
  columnTags: Array<{
    key: string;
    value: string;
    __typename: string;
  }>;
  querySelection: string;
  __typename: string;
}

export interface CatalogView {
  id: string;
  creatorId: string;
  name: string;
  description?: string;
  icon?: string;
  isPrivate: boolean;
  selection: CatalogViewSelection;
  __typename: string;
}

export interface CatalogViewsResponse {
  catalogViews: CatalogView[];
}

export interface UserFavoriteAsset {
  path: string[];
  __typename: string;
}

export interface UserFavoriteAssetsResponse {
  userFavoriteAssets: UserFavoriteAsset[];
} 