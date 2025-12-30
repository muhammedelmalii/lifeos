import React from 'react';
import { Switch as RNSwitch, StyleSheet, SwitchProps } from 'react-native';
import { colors } from '@/theme';

interface CustomSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor'> {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const Switch: React.FC<CustomSwitchProps> = ({ value, onValueChange, ...props }) => {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: colors.background.tertiary,
        true: colors.accent.primary,
      }}
      thumbColor={value ? colors.text.primary : colors.text.tertiary}
      ios_backgroundColor={colors.background.tertiary}
      {...props}
    />
  );
};

