import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '@/theme';

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'energy_low' | 'energy_medium' | 'energy_high';
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({ label, icon, variant = 'default', style }) => {
  return (
    <View style={[styles.chip, styles[`chip_${variant}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chip_default: {
    backgroundColor: colors.background.tertiary,
  },
  chip_accent: {
    backgroundColor: colors.accent.light,
  },
  chip_energy_low: {
    backgroundColor: colors.energy.low + '33',
  },
  chip_energy_medium: {
    backgroundColor: colors.energy.medium + '33',
  },
  chip_energy_high: {
    backgroundColor: colors.energy.high + '33',
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.caption,
    fontWeight: '500',
  },
  text_default: {
    color: colors.text.secondary,
  },
  text_accent: {
    color: colors.accent.primary,
  },
  text_energy_low: {
    color: colors.energy.low,
  },
  text_energy_medium: {
    color: colors.energy.medium,
  },
  text_energy_high: {
    color: colors.energy.high,
  },
});

