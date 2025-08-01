// Mock data for development and testing
export const mockAssets = [
  {
    id: '1',
    key: { path: ['raw', 'users'] },
    definition: {
      opName: 'raw_users',
      description: 'Raw user data from database',
      assetKey: { path: ['raw', 'users'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T10:30:00Z' },
      { timestamp: '2024-01-14T15:20:00Z' },
      { timestamp: '2024-01-13T09:45:00Z' }
    ]
  },
  {
    id: '2',
    key: { path: ['processed', 'user_metrics'] },
    definition: {
      opName: 'user_metrics',
      description: 'Processed user metrics and analytics',
      assetKey: { path: ['processed', 'user_metrics'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T11:45:00Z' },
      { timestamp: '2024-01-14T16:30:00Z' }
    ]
  },
  {
    id: '3',
    key: { path: ['ml', 'user_predictions'] },
    definition: {
      opName: 'user_predictions',
      description: 'ML model predictions for user behavior',
      assetKey: { path: ['ml', 'user_predictions'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T08:15:00Z' }
    ]
  },
  {
    id: '4',
    key: { path: ['ANALYTICS', 'company_perf'] },
    definition: {
      opName: 'company_perf',
      description: 'Company performance analytics',
      assetKey: { path: ['ANALYTICS', 'company_perf'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T12:00:00Z' },
      { timestamp: '2024-01-14T12:00:00Z' },
      { timestamp: '2024-01-13T12:00:00Z' }
    ]
  },
  {
    id: '5',
    key: { path: ['ANALYTICS', 'all_orders'] },
    definition: {
      opName: 'all_orders',
      description: 'All order data analytics',
      assetKey: { path: ['ANALYTICS', 'all_orders'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T13:30:00Z' },
      { timestamp: '2024-01-14T13:30:00Z' }
    ]
  },
  {
    id: '6',
    key: { path: ['ANALYTICS', 'orders_augmented'] },
    definition: {
      opName: 'orders_augmented',
      description: 'Augmented order data with additional features',
      assetKey: { path: ['ANALYTICS', 'orders_augmented'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T14:15:00Z' },
      { timestamp: '2024-01-14T14:15:00Z' }
    ]
  },
  {
    id: '7',
    key: { path: ['CLEANED', 'users_cleaned'] },
    definition: {
      opName: 'users_cleaned',
      description: 'Cleaned and validated user data',
      assetKey: { path: ['CLEANED', 'users_cleaned'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T09:00:00Z' },
      { timestamp: '2024-01-14T09:00:00Z' }
    ]
  },
  {
    id: '8',
    key: { path: ['orders_augmented'] },
    definition: {
      opName: 'orders_augmented',
      description: 'Orders with augmented features',
      assetKey: { path: ['orders_augmented'] }
    },
    assetMaterializations: [
      { timestamp: '2024-01-15T16:45:00Z' }
    ]
  }
];

export const mockRuns = [
  // batch_enrichment pipeline runs
  {
    id: '1',
    runId: 'run_001',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    pipelineName: 'batch_enrichment'
  },
  {
    id: '2',
    runId: 'run_002',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
    pipelineName: 'batch_enrichment'
  },
  {
    id: '3',
    runId: 'run_003',
    status: 'FAILURE',
    startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    endTime: new Date(Date.now() - 5 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    pipelineName: 'batch_enrichment'
  },
  {
    id: '4',
    runId: 'run_004',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    endTime: new Date(Date.now() - 6 * 60 * 60 * 1000 + 18 * 60 * 1000).toISOString(),
    pipelineName: 'batch_enrichment'
  },

  // run_etl_pipeline runs
  {
    id: '5',
    runId: 'run_005',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    pipelineName: 'run_etl_pipeline'
  },
  {
    id: '6',
    runId: 'run_006',
    status: 'FAILURE',
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    endTime: new Date(Date.now() - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(),
    pipelineName: 'run_etl_pipeline'
  },
  {
    id: '7',
    runId: 'run_007',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 22 * 60 * 1000).toISOString(),
    pipelineName: 'run_etl_pipeline'
  },

  // data-eng-pipeline runs (frequent runs)
  {
    id: '8',
    runId: 'run_008',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    endTime: new Date(Date.now() - 30 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    pipelineName: 'data-eng-pipeline'
  },
  {
    id: '9',
    runId: 'run_009',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
    pipelineName: 'data-eng-pipeline'
  },
  {
    id: '10',
    runId: 'run_010',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    endTime: new Date(Date.now() - 90 * 60 * 1000 + 6 * 60 * 1000).toISOString(),
    pipelineName: 'data-eng-pipeline'
  },
  {
    id: '11',
    runId: 'run_011',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 120 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
    pipelineName: 'data-eng-pipeline'
  },

  // check_avg_orders_freshness_job runs (frequent runs)
  {
    id: '12',
    runId: 'run_012',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    endTime: new Date(Date.now() - 20 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    pipelineName: 'check_avg_orders_freshness_job'
  },
  {
    id: '13',
    runId: 'run_013',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 minutes ago
    endTime: new Date(Date.now() - 40 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
    pipelineName: 'check_avg_orders_freshness_job'
  },
  {
    id: '14',
    runId: 'run_014',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
    pipelineName: 'check_avg_orders_freshness_job'
  },

  // hooli_airlift runs
  {
    id: '15',
    runId: 'run_015',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    pipelineName: 'hooli_airlift'
  },

  // snowflake_insights_import runs
  {
    id: '16',
    runId: 'run_016',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    pipelineName: 'snowflake_insights_import'
  },
  {
    id: '17',
    runId: 'run_017',
    status: 'SUCCESS',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    pipelineName: 'snowflake_insights_import'
  }
];

export const mockPipelines = [
  {
    id: '1',
    name: 'data_ingestion_pipeline',
    status: 'SUCCESS',
    description: 'Pipeline with 5 runs'
  },
  {
    id: '2',
    name: 'user_metrics_pipeline',
    status: 'RUNNING',
    description: 'Pipeline with 3 runs'
  },
  {
    id: '3',
    name: 'ml_training_pipeline',
    status: 'FAILURE',
    description: 'Pipeline with 2 runs'
  }
]; 

// Mock logs data for testing
export const mockLogs = [
  {
    __typename: 'LogMessageEvent',
    message: 'Starting pipeline execution',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stepKey: 'start'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Loading data from source',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 1000).toISOString(),
    stepKey: 'load_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Data loaded successfully: 1,234 records',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 1000).toISOString(),
    stepKey: 'load_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Processing data transformation',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 20 * 1000).toISOString(),
    stepKey: 'transform_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Warning: Found 5 duplicate records, removing duplicates',
    level: 'WARNING',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 25 * 1000).toISOString(),
    stepKey: 'transform_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Data transformation completed successfully',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 1000).toISOString(),
    stepKey: 'transform_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Saving processed data to destination',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 35 * 1000).toISOString(),
    stepKey: 'save_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Pipeline execution completed successfully',
    level: 'INFO',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 40 * 1000).toISOString(),
    stepKey: 'end'
  }
];

// Mock logs for failed runs
export const mockFailedLogs = [
  {
    __typename: 'LogMessageEvent',
    message: 'Starting pipeline execution',
    level: 'INFO',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    stepKey: 'start'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Loading data from source',
    level: 'INFO',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 5 * 1000).toISOString(),
    stepKey: 'load_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'ERROR: Failed to connect to database: Connection timeout',
    level: 'ERROR',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 10 * 1000).toISOString(),
    stepKey: 'load_data'
  },
  {
    __typename: 'LogMessageEvent',
    message: 'Pipeline execution failed',
    level: 'ERROR',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 15 * 1000).toISOString(),
    stepKey: 'end'
  }
]; 