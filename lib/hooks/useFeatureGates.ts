import { useQuery } from '@apollo/client';
import {
  CLOUD_CONTEXT_FEATURE_GATES,
  COMPASS_FEATURE_GATE_KEY,
  AI_SUMMARIES_FEATURE_GATE_KEY,
  ISSUES_FEATURE_GATE_KEY,
} from '../graphql/compass';

type FeatureGate = {
  key: string;
  value: unknown;
};

const useGateValue = (key: string): boolean => {
  // `cache-and-network` returns the cached value immediately (so the gate
  // doesn't flicker off mid-session if the cache survives) and triggers a
  // background refetch. With plain `cache-first` we saw Compass UI vanish
  // until the next manual reload whenever the in-memory cache was evicted.
  const { data } = useQuery(CLOUD_CONTEXT_FEATURE_GATES, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  });
  const gates: FeatureGate[] = data?.identity?.featureGates ?? [];
  const gate = gates.find((g) => g.key === key);
  return gate?.value === true;
};

export const useCompassEnabled = () => useGateValue(COMPASS_FEATURE_GATE_KEY);
export const useAiSummariesEnabled = () => useGateValue(AI_SUMMARIES_FEATURE_GATE_KEY);
export const useIssuesEnabled = () => useGateValue(ISSUES_FEATURE_GATE_KEY);
