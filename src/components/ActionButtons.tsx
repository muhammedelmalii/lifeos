import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@/theme';
import { ActionButton } from '@/services/actionAssistant';
import { hapticFeedback } from '@/utils/haptics';

interface ActionButtonsProps {
  actions: ActionButton[];
  onActionPress: (action: ActionButton) => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ actions, onActionPress }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  const handlePress = (action: ActionButton) => {
    hapticFeedback.selection();
    onActionPress(action);
  };

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={[
            styles.button,
            action.type === 'confirm' && styles.buttonConfirm,
            action.type === 'suggest' && styles.buttonSuggest,
            action.type === 'alternative' && styles.buttonAlternative,
          ]}
          onPress={() => handlePress(action)}
          activeOpacity={0.7}
        >
          {action.icon && <Text style={styles.icon}>{action.icon}</Text>}
          <Text
            style={[
              styles.buttonText,
              action.type === 'confirm' && styles.buttonTextConfirm,
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 36,
  },
  buttonConfirm: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  buttonSuggest: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.accent.primary,
  },
  buttonAlternative: {
    backgroundColor: 'transparent',
    borderColor: colors.border.primary,
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  buttonText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  buttonTextConfirm: {
    color: colors.background.primary,
  },
});
