import { useQuery } from '@apollo/client';
import {
  CLOUD_CONTEXT_FEATURE_GATES,
  COMPASS_FEATURE_GATE_KEY,
  AI_SUMMARIES_FEATURE_GATE_KEY,
} from '../graphql/compass';

type FeatureGate = {
  key: string;
  value: unknown;
};

const useGateValue = (key: string): boolean => {
  const { data } = useQuery(CLOUD_CONTEXT_FEATURE_GATES, {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
  });
  const gates: FeatureGate[] = data?.identity?.featureGates ?? [];
  const gate = gates.find((g) => g.key === key);
  return gate?.value === true;
};

export const useCompassEnabled = () => useGateValue(COMPASS_FEATURE_GATE_KEY);
export const useAiSummariesEnabled = () => useGateValue(AI_SUMMARIES_FEATURE_GATE_KEY);
