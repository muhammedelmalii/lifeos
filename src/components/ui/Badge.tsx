import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'accent' | 'warning' | 'error';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  label, 
  variant = 'default',
  style 
}) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: colors.background.tertiary,
  },
  badge_accent: {
    backgroundColor: colors.accent.light,
  },
  badge_warning: {
    backgroundColor: colors.status.warning + '33',
  },
  badge_error: {
    backgroundColor: colors.status.error + '33',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
  text_default: {
    color: colors.text.secondary,
  },
  text_accent: {
    color: colors.accent.primary,
  },
  text_warning: {
    color: colors.status.warning,
  },
  text_error: {
    color: colors.status.error,
  },
});

