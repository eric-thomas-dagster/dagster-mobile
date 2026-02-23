import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from './ThemeProvider';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceVariant,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Card skeleton for runs, jobs, assets
export const CardSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <SkeletonLoader width="60%" height={24} />
          <SkeletonLoader width={80} height={28} borderRadius={14} />
        </View>
        <View style={styles.details}>
          <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="70%" height={16} />
        </View>
      </View>
    </View>
  );
};

// Dashboard stats skeleton
export const StatsSkeleton: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.cardContent}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <SkeletonLoader width={40} height={32} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={60} height={14} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={40} height={32} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={60} height={14} />
          </View>
          <View style={styles.statItem}>
            <SkeletonLoader width={40} height={32} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={60} height={14} />
          </View>
        </View>
      </View>
    </View>
  );
};

// List of card skeletons
export const CardSkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  details: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
});
