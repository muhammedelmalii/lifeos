import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, spacing, typography } from '@/theme';
import { Icon } from './ui';

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeRight?: () => void; // Complete
  onSwipeLeft?: () => void; // Couldn't Do It
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled = false,
}) => {
  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View style={[styles.rightAction, { transform: [{ scale }] }]}>
        <View style={styles.actionContent}>
          <Icon name="check" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Tamamla</Text>
        </View>
      </Animated.View>
    );
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View style={[styles.leftAction, { transform: [{ scale }] }]}>
        <View style={styles.actionContent}>
          <Icon name="close" size={24} color={colors.text.primary} />
          <Text style={styles.actionText}>Yapamadım</Text>
        </View>
      </Animated.View>
    );
  };

  if (disabled) {
    return <View>{children}</View>;
  }

  return (
    <Swipeable
      renderRightActions={onSwipeRight ? renderRightActions : undefined}
      renderLeftActions={onSwipeLeft ? renderLeftActions : undefined}
      onSwipeableRightOpen={onSwipeRight}
      onSwipeableLeftOpen={onSwipeLeft}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightAction: {
    flex: 1,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: spacing.lg,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  leftAction: {
    flex: 1,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: spacing.lg,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
});

