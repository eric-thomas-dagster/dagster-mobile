import React from 'react';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BRAND_SVGS } from './BrandSvgs';
import { GENERIC_SVGS } from './GenericSvgs';
import { useTheme } from '../ThemeProvider';

// Aliases: stored icon values that don't have their own SVG but should reuse
// an existing one.
const BRAND_ALIASES: Record<string, string> = {
  gcp: 'googlecloud',
  gcs: 'googlecloud',
  dbtcloud: 'dbt',
  postgresql: 'postgres',
  mariadb: 'mysql',
  snowpark: 'snowflake',
  airliftmapped: 'airflow',
  hackernews: 'hex', // no good logo; at least stays branded
};

const resolveBrandKey = (icon: string): string | null => {
  const key = icon.toLowerCase();
  if (BRAND_SVGS[key]) return key;
  if (BRAND_ALIASES[key] && BRAND_SVGS[BRAND_ALIASES[key]]) return BRAND_ALIASES[key];
  const toolMatch = key.match(/^tool-(.+?)(-color|-light|-dark)?$/);
  if (toolMatch) {
    const bare = toolMatch[1];
    if (BRAND_SVGS[bare]) return bare;
    if (BRAND_ALIASES[bare] && BRAND_SVGS[BRAND_ALIASES[bare]]) return BRAND_ALIASES[bare];
  }
  return null;
};

// Maps Dagster+ icon string values to display emojis.
//
// Two sources of truth in dagster-io/dagster:
//   1. js_modules/ui-components/src/icon-svgs/            — generic UI icons (423)
//   2. js_modules/ui-core/src/graph/OpTags.tsx            — tool/integration
//      icons (236), exposed in the catalog-view icon picker as
//      `tool-<brand>-color.svg` assets.
//
// The web UI renders crisper brand SVGs; emojis are a pragmatic, zero-dep
// approximation that reads well in a mobile picker list. Unknown keys fall
// back to 📦. Keys are normalized lowercase; we also strip the
// `tool-` prefix and `-color`/`-light`/`-dark` suffix so both forms
// (`airflow` and `tool-airflow-color`) resolve the same way.
const ICON_EMOJI: Record<string, string> = {
  // ─── Generic UI icons (subset from icon-svgs that commonly appears in catalog views) ───
  snowflake: '❄️',
  databricks: '🧱',
  dbt: '🐝',
  dbtcloud: '🐝',
  airflow: '🌀',
  airliftmapped: '🌀',
  slack: '💬',
  slack_color: '💬',
  ms_teams: '💬',
  ms_teams_color: '💬',
  teams: '💬',
  github: '🐙',
  github_pr_closed: '🐙',
  github_pr_merged: '🐙',
  github_pr_open: '🐙',
  gitlab: '🦊',
  python: '🐍',
  open_ai: '🤖',
  openai: '🤖',
  claude: '🧠',
  pagerduty: '📟',
  pagerduty_color: '📟',
  dagsterlabs: '🧭',
  dagster_primary: '🧭',
  dagster_reversed: '🧭',
  dagster_solid: '🧭',
  youtube: '📺',

  // ─── People / org / access ───
  people: '👥',
  team: '👥',
  organization: '🏢',
  corporate_fare: '🏢',
  owner: '👤',
  account_circle: '👤',
  admin: '🛡️',
  agent: '🛰️',
  badge: '🪪',
  role_admin: '🛡️',
  role_custom: '🧰',
  role_editor: '✏️',
  role_launcher: '🚀',
  role_viewer: '👁️',
  editor_role: '✏️',
  no_access: '🚫',
  visibility: '👁️',
  visibility_off: '🙈',
  lock: '🔒',
  unlocked: '🔓',
  password: '🔒',
  secure: '🔒',
  verified: '✔️',
  sso: '🔐',
  scim_provision: '🔐',
  token: '🔑',

  // ─── Alerts / status / priority ───
  alert: '🔔',
  warning: '⚠️',
  warning_outline: '⚠️',
  warning_trend: '📉',
  error: '❗',
  error_outline: '❗',
  bug: '🐛',
  check_circle: '✅',
  check_passed: '✅',
  check_failed: '❌',
  check_missing: '❓',
  check_warning: '⚠️',
  check_filled: '✅',
  check_started: '⏳',
  check_error: '❌',
  success: '✅',
  successful_trend: '📈',
  failure_trend: '📉',
  approved: '✅',
  cancel: '🚫',
  priority_1: '🔴',
  priority_2: '🟠',
  priority_3: '🟡',
  priority_4: '🟢',
  priority_5: '🔵',
  priority_6: '🟣',
  priority_7: '⚪',
  priority_8: '⚫',
  priority_9: '🟤',

  // ─── Dagster objects ───
  asset: '📦',
  asset_check: '✅',
  asset_external: '🔗',
  asset_group: '🗂️',
  asset_legacy: '📦',
  asset_non_sda: '📦',
  asset_plot: '📈',
  multi_asset: '🗂️',
  observation: '👁️',
  observation_planned: '👁️',
  observation_started: '👁️',
  materialization: '✨',
  materialization_event: '✨',
  materialization_planned: '🗓️',
  materialization_started: '⏳',
  automation: '🤖',
  automation_condition: '🤖',
  job: '🔧',
  run: '🏃',
  run_queued: '⏳',
  run_started: '▶️',
  run_success: '✅',
  run_failed: '❌',
  run_canceled: '🚫',
  runs: '🏃',
  run_with_subruns: '🏃',
  schedule: '🕐',
  sensor: '📡',
  sensors: '📡',
  op: '⚙️',
  op_dynamic: '⚙️',
  op_selector: '⚙️',
  graph: '🕸️',
  graph_downstream: '⬇️',
  graph_upstream: '⬆️',
  graph_horizontal: '↔️',
  graph_vertical: '↕️',
  graph_neighbors: '🔗',
  backfill: '🔙',
  partition: '🧩',
  partition_failure: '🧩',
  partition_missing: '🧩',
  partition_set: '🧩',
  partition_stale: '🧩',
  partition_success: '🧩',
  daemon: '😈',
  serverless: '☁️',
  serve: '🛎️',
  hybrid: '🔀',

  // ─── Charts / analytics / insights ───
  chart_bar: '📊',
  chart_line: '📈',
  chart_pie: '🥧',
  bar_chart: '📊',
  waterfall_chart: '📊',
  trending_up: '📈',
  trending_down: '📉',
  trending_flat: '➖',
  insights: '📊',
  reporting: '📊',

  // ─── Data / infra primitives ───
  database: '🗄️',
  storage_kind: '💾',
  compute_kind: '🧮',
  memory: '💾',
  cpu: '🧮',
  gauge: '🎚️',
  speed: '⚡',
  bolt: '⚡',
  data_object: '🗄️',
  data_reliability: '🛡️',
  data_type: '🔤',
  table_columns: '🗃️',
  table_rows: '📋',
  table_view: '📋',
  column_lineage: '📊',
  column_schema: '🗂️',
  schema: '🗂️',
  lineage: '🔗',
  lineage_depth: '🔗',
  lineage_downstream: '⬇️',
  lineage_upstream: '⬆️',

  // ─── Finance / cost ───
  cost_dollar: '💵',
  cost_euro: '💶',
  cost_pound: '💷',
  cost_yen: '💴',
  cost_franc: '💵',
  cost_rupee: '💵',
  credit_card: '💳',
  credits: '💳',
  dollar_sign: '💲',

  // ─── Time ───
  calendar: '📅',
  history: '🕐',
  clock: '🕐',
  hourglass: '⏳',
  hourglass_bottom: '⏳',
  timer: '⏱️',
  timestamp: '⏱️',
  date: '📅',
  duration: '⏱️',

  // ─── Search / list / view ───
  filter: '🔍',
  filter_alt: '🔍',
  list: '📋',
  grid: '▦',
  group_by: '🗂️',
  catalog: '📚',
  catalog_book: '📚',
  checklist: '☑️',
  search: '🔍',
  magnify_glass: '🔍',

  // ─── Files / folders / docs ───
  folder: '📁',
  folder_open: '📂',
  file_csv: '📄',
  file_json: '📄',
  file_markdown: '📄',
  file_pdf: '📄',
  file_sql: '📄',
  file_yaml: '📄',
  documentation: '📖',
  description: '📝',
  concept_book: '📖',
  menu_book: '📖',

  // ─── Cloud / deployment ───
  cloud: '☁️',
  deployment: '🚀',
  base_deployment: '🚀',
  branch_deployment: '🌿',
  workspace: '🗂️',
  workspaces: '🗂️',
  code_location: '📍',
  code_block: '📝',

  // ─── Generic symbols ───
  globe: '🌐',
  star: '⭐',
  star_outline: '☆',
  star_half: '⭐',
  star_double: '✨',
  heart: '❤️',
  flag: '🚩',
  rainbow: '🌈',
  sun: '☀️',
  nightlight: '🌙',
  diamond: '💎',
  shield: '🛡️',
  shield_check: '🛡️',
  key_command: '⌘',
  help_circle: '❓',
  info: 'ℹ️',
  info_filled: 'ℹ️',
  compass: '🧭',
  smart_toy: '🤖',
  support: '💁',
  forum: '💬',
  chat_support: '💬',
  rss: '📡',
  webhook: '🪝',
  notifications: '🔔',
  notifications_off: '🔕',
  email: '📧',
  link: '🔗',
  open_in_new: '↗️',

  // ─── Actions / controls ───
  play: '▶️',
  pause: '⏸️',
  launch: '🚀',
  launchpad: '🚀',
  refresh: '🔄',
  reload: '🔄',
  sync: '🔄',
  sync_problem: '⚠️',
  cached: '⚡',
  replay: '⏮️',

  // ─── Git ───
  git_closed: '🔀',
  git_commit: '🌀',
  git_merged: '🔀',
  git_pr: '🔀',
  git_repository: '📁',
  branch: '🌿',
  changelog: '📝',

  // ─── Integrations: cloud ───
  aws: '☁️',
  gcp: '☁️',
  googlecloud: '☁️',
  azure: '☁️',
  azuredevops: '☁️',
  azureml: '🤖',
  vercel: '▲',
  modal: '◼️',
  runpod: '▶️',
  hashicorp: '🗝️',
  supabase: '⚡',
  lakefs: '🏞️',
  minio: '🪣',
  gcs: '🪣',
  s3: '🪣',
  sagemaker: '🤖',

  // ─── Integrations: databases / warehouses ───
  postgres: '🐘',
  postgresql: '🐘',
  mysql: '🐬',
  mariadb: '🐬',
  mongodb: '🍃',
  sqlite: '🗄️',
  sqlserver: '🗄️',
  oracle: '🗄️',
  redshift: '🔺',
  bigquery: '🔎',
  athena: '🏛️',
  duckdb: '🦆',
  ducklake: '🦆',
  clickhouse: '🗄️',
  cockroachdb: '🪳',
  redis: '📕',
  cassandra: '🪨',
  scylladb: '🦎',
  elasticsearch: '🔍',
  impala: '🦌',
  trino: '🔻',
  presto: '⚡',
  dremio: '💎',
  druid: '🧙',
  pinot: '🍷',
  doris: '🗄️',
  starrocks: '⭐',
  spanner: '🔧',
  teradata: '🗄️',
  treasuredata: '🗄️',
  denodo: '🗄️',
  exasol: '🗄️',
  hadoop: '🐘',

  // ─── Integrations: ELT / ingestion ───
  sling: '💧',
  fivetran: '🔁',
  airbyte: '🔁',
  stitch: '🧵',
  meltano: '🫠',
  dlt: '💧',
  dlthub: '💧',
  matillion: '🔄',
  hightouch: '📤',
  census: '📊',
  segment: '🔀',
  prefect: '🎯',
  tecton: '🧊',
  kedro: '🎞️',
  talend: '🔧',
  airtable: '🗂️',
  googlesheets: '📊',
  googledrive: '📁',
  sharepoint: '🗂️',
  excel: '📊',

  // ─── Integrations: BI / dashboards ───
  tableau: '📊',
  looker: '🔍',
  powerbi: '📊',
  metabase: '📈',
  sigma: 'Σ',
  hex: '#️⃣',
  thoughtspot: '💡',
  superset: '📊',
  evidence: '🔬',
  omni: '🌐',
  plotly: '📈',
  cube: '🎲',

  // ─── Integrations: ML / AI ───
  pytorch: '🔥',
  pytorchlightning: '⚡',
  tensorflow: '🧠',
  scikitlearn: '📊',
  numpy: '🔢',
  scipy: '🧮',
  pandas: '🐼',
  polars: '🐻‍❄️',
  matplotlib: '📊',
  ray: '⚡',
  mlflow: '🧪',
  wandb: '📈',
  catboost: '🐱',
  lightgbm: '💡',
  xgboost: '🚀',
  optuna: '🎯',
  dspy: '🔮',
  dask: '🎯',
  ax: '🎯',
  botorch: '🔥',
  langfuse: '🦜',
  dify: '🤖',
  chalk: '🖍️',
  huggingface: '🤗',
  huggingfaceapi: '🤗',
  gemini: '♊',
  mistral: '🌬️',
  llama: '🦙',
  meta: '🧠',
  deepseek: '🔍',
  notdiamond: '🔷',
  qwen: '🧠',
  doubao: '🤖',
  databento: '📊',
  weaviate: '🧬',
  rockset: '🚀',

  // ─── Integrations: observability / quality ───
  datadog: '🐶',
  grafana: '📊',
  papertrail: '📜',
  pandera: '🐼',
  greatexpectations: '✨',
  soda: '🥤',
  montecarlo: '🎲',
  sdf: '📄',
  sqlmesh: '🕸️',

  // ─── Integrations: notifications / comms ───
  discord: '🎮',
  twilio: '📱',
  zendesk: '🎧',
  stripe: '💳',
  salesforce: '💼',
  shopify: '🛍️',
  hackernews: '🔥',
  hackernewsapi: '🔥',
  gmail: '📧',
  posthog: '🦔',
  braze: '🔥',

  // ─── Integrations: data catalog / governance ───
  atlan: '🗺️',
  collibra: '🎨',
  datahub: '🏘️',
  openmetadata: '📖',
  secoda: '🗂️',

  // ─── Integrations: storage formats ───
  parquet: '📄',
  deltalake: '🔺',
  iceberg: '🧊',
  icechunk: '🧊',
  hudi: '🏹',
  arrow: '➡️',

  // ─── Integrations: orchestration / workflow ───
  kubernetes: '☸️',
  docker: '🐳',
  celery: '🥬',
  stepfunctions: '🔁',
  awsstepfunctions: '🔁',
  stepfunction: '🔁',
  awsstepfunction: '🔁',
  flink: '🐿️',
  kafka: '📮',
  rabbitmq: '🐰',
  pulsar: '📡',
  redpanda: '🐼',
  spark: '⚡',
  snowpark: '❄️',
  pyspark: '⚡',

  // ─── Integrations: issue tracking / knowledge ───
  linear: '📐',
  notion: '📓',
  jira: '🎯',

  // ─── Integrations: social / consumer ───
  twitter: '🐦',
  x: '❌',
  facebook: '📘',
  instagram: '📷',
  linkedin: '💼',
  reddit: '🤖',
  tiktok: '🎵',
  wechat: '💬',
  dingtalk: '💬',
  volcengine: '🌋',
  google: '🔍',
  microsoft: '🪟',
  react: '⚛️',

  // ─── Languages ───
  typescript: '🔷',
  javascript: '🟨',
  rust: '🦀',
  scala: '🔴',
  java: '☕',
  go: '🐹',
  r: '📊',
  csharp: '🎼',
  cplus: '➕',
  cplusplus: '➕',
  net: '🔷',

  // ─── File formats ───
  csv: '📄',
  pdf: '📄',
  yaml: '📄',
  json: '📄',
  toml: '📄',
  ipynb: '📓',
  jupyter: '📓',
  notebook: '📓',
  papermill: '📓',
  noteable: '📓',

  // ─── Misc object kinds ───
  table: '📋',
  view: '👁️',
  dag: '🕸️',
  task: '📋',
  source: '⤴️',
  source_asset: '⤴️',
  seed: '🌱',
  file: '📄',
  semanticmodel: '🧠',
  dataset: '📊',
  workbook: '📓',
  report: '📄',
  dashboard: '📊',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  thumb_up: '👍',
  thumb_down: '👎',
  tag: '🏷️',
  label: '🏷️',
  bookmark: '🔖',
  test: '🧪',
  expectation: '🎯',
  target: '🎯',
  freshness: '🍃',
  blueprint: '📐',
  resource: '🧰',
  rule: '📜',
  issue: '❗',
  summarize: '📝',
  metadata: '🏷️',
  definition: '📋',
  logs_stderr: '📜',
  logs_stdout: '📜',
  logs_structured: '📜',
  ingest: '⤵️',
  transform: '🔄',
  sinks: '⤵️',
  gantt_flat: '📊',
  gantt_time: '📊',
  gantt_waterfall: '📊',
  plots: '📊',
  eco: '🌿',
  elt: '🔀',

  // ─── Misc integrations / stragglers ───
  hackernewsapi_raw: '🔥',
  axioma: '🎯',
  datahub_raw: '🏘️',
  shell: '🐚',
  trino_sql: '🔻',
  posthog_raw: '🦔',
  gmail_raw: '📧',
  huggingface_raw: '🤗',
  expandcolor: '⛶', // artifact of the regex in my extraction — safe to ignore
};

export const getCatalogViewEmoji = (icon?: string | null): string => {
  if (!icon) return '📦';
  const key = icon.toLowerCase();
  // Exact match first
  if (ICON_EMOJI[key]) return ICON_EMOJI[key];
  // Normalize Dagster's tool-<name>-color (also -light/-dark) convention
  const toolMatch = key.match(/^tool-(.+?)(-color|-light|-dark)?$/);
  if (toolMatch) {
    const bare = toolMatch[1];
    if (ICON_EMOJI[bare]) return ICON_EMOJI[bare];
  }
  return '📦';
};

type Props = {
  icon?: string | null;
  size?: number;
};

// Dagster's monochrome SVGs are all filled with #030615. We swap that to the
// current theme's onSurface color so icons read correctly in dark mode.
const GENERIC_FILL_SOURCE = '#030615';
const recolorGeneric = (svg: string, color: string): string =>
  svg.split(GENERIC_FILL_SOURCE).join(color);

const resolveGenericKey = (icon: string): string | null => {
  const key = icon.toLowerCase();
  if (GENERIC_SVGS[key]) return key;
  // A handful of names use hyphens in the filesystem; handle both forms
  const hyphen = key.replace(/_/g, '-');
  if (GENERIC_SVGS[hyphen]) return hyphen;
  const underscore = key.replace(/-/g, '_');
  if (GENERIC_SVGS[underscore]) return underscore;
  return null;
};

export const CatalogViewIcon: React.FC<Props> = ({ icon, size = 16 }) => {
  const { theme } = useTheme();

  // 1. Brand SVG (dbt, airflow, snowflake, etc.) — render as-is with brand colors
  const brandKey = icon ? resolveBrandKey(icon) : null;
  if (brandKey && BRAND_SVGS[brandKey]) {
    return (
      <View style={{ width: size, height: size }}>
        <SvgXml xml={BRAND_SVGS[brandKey]} width={size} height={size} />
      </View>
    );
  }

  // 2. Generic Dagster icon (chart_pie, warning_outline, people, globe, etc.)
  //    — recolor monochrome fill to match the current theme
  const genericKey = icon ? resolveGenericKey(icon) : null;
  if (genericKey && GENERIC_SVGS[genericKey]) {
    const recolored = recolorGeneric(GENERIC_SVGS[genericKey], theme.colors.onSurface);
    return (
      <View style={{ width: size, height: size }}>
        <SvgXml xml={recolored} width={size} height={size} />
      </View>
    );
  }

  // 3. Emoji fallback for anything we don't have an SVG for
  return <Text style={{ fontSize: size }}>{getCatalogViewEmoji(icon)}</Text>;
};
