import React, { useCallback, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import type { DocumentNode } from '@apollo/client';
import { useChatStream } from './useChatStream';
import { ChatBlocks } from './ChatBlocks';
import { useTheme } from '../ThemeProvider';
import { useAiSummariesEnabled } from '../../lib/hooks/useFeatureGates';

type Props = {
  subscription: DocumentNode;
  responseField: string;
  variables: Record<string, unknown>;
  buttonLabel?: string;
};

export const AISummaryCard: React.FC<Props> = ({
  subscription,
  responseField,
  variables,
  buttonLabel = '✨ Summarize with AI',
}) => {
  const { theme } = useTheme();
  const enabled = useAiSummariesEnabled();
  const [started, setStarted] = useState(false);

  const buildVariables = useCallback(() => variables, [variables]);

  const { messages, status, send, reset } = useChatStream({
    subscription,
    buildVariables,
    responseField,
  });

  if (!enabled) return null;

  const assistant = messages.find((m) => m.role === 'assistant');

  const handleStart = () => {
    setStarted(true);
    send('');
  };

  const handleRetry = () => {
    reset();
    send('');
  };

  if (!started) {
    return (
      <TouchableOpacity
        onPress={handleStart}
        style={[
          styles.triggerBtn,
          { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
        ]}
        activeOpacity={0.7}
      >
        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{buttonLabel}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          ✨ AI summary
          {status === 'streaming' && '  •  streaming'}
        </Text>
        {status !== 'streaming' && (
          <TouchableOpacity onPress={handleRetry}>
            <Text style={{ color: theme.colors.primary, fontSize: 12 }}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {!assistant && status === 'streaming' && (
        <View style={styles.row}>
          <ActivityIndicator size="small" />
          <Text style={[styles.thinking, { color: theme.colors.onSurfaceVariant }]}>
            Gathering context…
          </Text>
        </View>
      )}

      {assistant && <ChatBlocks message={assistant} />}
    </View>
  );
};

const styles = StyleSheet.create({
  triggerBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinking: { fontStyle: 'italic', fontSize: 13 },
});
