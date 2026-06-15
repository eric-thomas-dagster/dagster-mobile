import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';
import { useIssuesEnabled } from '../../lib/hooks/useFeatureGates';

interface MoreScreenProps {
  navigation: any;
}

type Row = {
  key: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description?: string;
  onPress: () => void;
};

const MoreScreen: React.FC<MoreScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const issuesEnabled = useIssuesEnabled();

  const rows: Row[] = [
    {
      key: 'insights',
      label: 'Insights',
      icon: 'insights',
      description: 'Materializations, failures, credits, and more',
      onPress: () => navigation.navigate('InsightsMain'),
    },
  ];

  if (issuesEnabled) {
    rows.push({
      key: 'issues',
      label: 'Issues',
      icon: 'report-problem',
      description: 'Track and resolve pipeline issues',
      onPress: () => navigation.navigate('IssueList'),
    });
  }

  rows.push({
    key: 'settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Connection, appearance, and biometric auth',
    onPress: () => navigation.navigate('Settings'),
  });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {rows.map((row, idx) => (
          <TouchableOpacity
            key={row.key}
            activeOpacity={0.6}
            onPress={row.onPress}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderBottomColor: theme.colors.outline,
                borderBottomWidth: idx === rows.length - 1 ? 0 : StyleSheet.hairlineWidth,
              },
            ]}
          >
            <MaterialIcons name={row.icon} size={24} color={theme.colors.onSurfaceVariant} />
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: theme.colors.onSurface }]}>{row.label}</Text>
              {row.description && (
                <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                  {row.description}
                </Text>
              )}
            </View>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 12, marginTop: 2 },
});

export default MoreScreen;
