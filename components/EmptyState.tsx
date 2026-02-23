import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

interface EmptyStateProps {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onActionPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <MaterialIcons
        name={icon}
        size={64}
        color={theme.colors.onSurfaceVariant}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      )}
      {actionLabel && onActionPress && (
        <Button mode="contained" onPress={onActionPress} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
});

export default EmptyState;
