import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, shadows } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  return <View style={[styles.card, styles[`card_${variant}`], style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
  },
  card_default: {
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  card_elevated: {
    ...shadows.md,
  },
});

