import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableOpacity, View, Dimensions } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { CompassIcon } from './CompassIcon';

type Props = {
  onPress: () => void;
};

const SIZE = 56;
const MARGIN = 16;

export const CompassFloatingButton: React.FC<Props> = ({ onPress }) => {
  const { theme } = useTheme();
  const { width, height } = Dimensions.get('window');

  const pan = useRef(
    new Animated.ValueXY({
      x: width - SIZE - MARGIN,
      y: height - SIZE - 120,
    }),
  ).current;
  const offset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        moved.current = false;
        offset.current = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) {
          moved.current = true;
        }
        pan.setValue({
          x: offset.current.x + gesture.dx,
          y: offset.current.y + gesture.dy,
        });
      },
      onPanResponderRelease: () => {
        if (!moved.current) {
          onPress();
          return;
        }
        // Snap to nearest edge
        const { width: w, height: h } = Dimensions.get('window');
        const current = { x: (pan.x as any)._value, y: (pan.y as any)._value };
        const snapX = current.x + SIZE / 2 < w / 2 ? MARGIN : w - SIZE - MARGIN;
        const clampedY = Math.max(60, Math.min(h - SIZE - 100, current.y));
        Animated.spring(pan, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
          transform: pan.getTranslateTransform(),
        },
      ]}
      {...panResponder.panHandlers}
      pointerEvents="box-only"
    >
      <View style={styles.inner}>
        <CompassIcon size={30} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
