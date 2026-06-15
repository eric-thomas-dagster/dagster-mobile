import { gql } from '@apollo/client';

// Shared fragment for all Compass-style streaming responses.
export const CHAT_RESPONSE_CHUNK_FRAGMENT = gql`
  fragment ChatResponseChunkFields on ChatResponseChunkOrError {
    ...StartChatStreamFields
    ...CompleteChatStreamFields
    ...StartTextBlockFields
    ...DeltaTextBlockFields
    ...CompleteTextBlockFields
    ...StartToolBlockFields
    ...DeltaToolInputBlockFields
    ...CompleteToolBlockFields
    ...AiSummaryErrorFields
    ...PythonErrorFields
    __typename
  }

  fragment StartChatStreamFields on StartChatStream {
    chatId
    __typename
  }

  fragment CompleteChatStreamFields on CompleteChatStream {
    suggestedReplies
    __typename
  }

  fragment StartTextBlockFields on StartTextBlock {
    placeholder
    __typename
  }

  fragment DeltaTextBlockFields on DeltaTextBlock {
    textFragment
    __typename
  }

  fragment CompleteTextBlockFields on CompleteTextBlock {
    placeholder
    __typename
  }

  fragment StartToolBlockFields on StartToolBlock {
    toolType
    toolId
    __typename
  }

  fragment DeltaToolInputBlockFields on DeltaToolInputBlock {
    jsonFragment
    __typename
  }

  fragment CompleteToolBlockFields on CompleteToolBlock {
    toolError {
      message
      __typename
    }
    __typename
  }

  fragment AiSummaryErrorFields on AISummaryError {
    message
    __typename
  }

  fragment PythonErrorFields on PythonError {
    message
    __typename
  }
`;

export const AI_CHAT_SUBSCRIPTION = gql`
  subscription AIChat($chatId: Int!, $payload: String!) {
    aiChat(chatId: $chatId, payload: $payload) {
      ...ChatResponseChunkFields
      __typename
    }
  }
  ${CHAT_RESPONSE_CHUNK_FRAGMENT}
`;

export const AI_SUMMARY_FOR_ASSET_MATERIALIZATION_SUBSCRIPTION = gql`
  subscription AISummaryForAssetMaterialization($runId: ID!, $assetKey: AssetKeyInput!) {
    aiSummaryForAssetMaterialization(runId: $runId, assetKey: $assetKey) {
      ...ChatResponseChunkFields
      __typename
    }
  }
  ${CHAT_RESPONSE_CHUNK_FRAGMENT}
`;

// Reads the feature-gate and viewer identity needed to decide whether to surface Compass.
export const CLOUD_CONTEXT_FEATURE_GATES = gql`
  query CloudContextFeatureGates {
    identity {
      featureGates {
        key
        value
        __typename
      }
      __typename
    }
  }
`;

export const COMPASS_FEATURE_GATE_KEY = 'DAGSTER_PLUS_COMPASS_ENABLED';
export const AI_SUMMARIES_FEATURE_GATE_KEY = 'ENABLE_AI_SUMMARIES';
export const ISSUES_FEATURE_GATE_KEY = 'DAGSTER_PLUS_ISSUES_ENABLED';
