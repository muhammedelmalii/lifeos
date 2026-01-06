/**
 * Skeleton Loading Component
 * Provides smooth loading states
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '@/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'rectangular',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getBorderRadius = () => {
    if (variant === 'circular') return height / 2;
    if (variant === 'text') return 4;
    return borderRadius;
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: getBorderRadius(),
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton width="60%" height={16} variant="text" style={styles.title} />
    <Skeleton width="100%" height={12} variant="text" style={styles.line} />
    <Skeleton width="80%" height={12} variant="text" style={styles.line} />
    <View style={styles.footer}>
      <Skeleton width={60} height={24} borderRadius={12} />
      <Skeleton width={80} height={24} borderRadius={12} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border.secondary,
  },
  card: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    marginBottom: 12,
  },
  line: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});

