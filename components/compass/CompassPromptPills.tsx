import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../ThemeProvider';
import { useCompass } from './CompassProvider';
import { CompassIcon } from './CompassIcon';

export type CompassPrompt = {
  label: string;
  prompt: string;
};

type Props = {
  prompts: CompassPrompt[];
};

export const CompassPromptPills: React.FC<Props> = ({ prompts }) => {
  const { theme } = useTheme();
  const { enabled, openWithPrompt, setScreenSuggestions } = useCompass();

  // While this pill row is on-screen, register its prompts as the page's
  // contextual suggestions. The Compass sheet's empty state uses them
  // instead of generic starter prompts when the user opens Compass here.
  useEffect(() => {
    if (!enabled || prompts.length === 0) return;
    setScreenSuggestions(prompts);
    return () => setScreenSuggestions(null);
  }, [enabled, prompts, setScreenSuggestions]);

  if (!enabled || prompts.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <CompassIcon size={12} />
        <Text style={[styles.heading, { color: theme.colors.onSurfaceVariant }]}>
          Ask Compass
        </Text>
      </View>
      <View style={styles.row}>
        {prompts.map((p) => (
          <TouchableOpacity
            key={p.label}
            onPress={() => openWithPrompt(p.prompt)}
            style={[
              styles.pill,
              { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
            ]}
            activeOpacity={0.7}
          >
            <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '600' }}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  heading: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
