/**
 * Proactive Suggestions Component
 * Shows helpful suggestions to users without them asking
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Icon, Button } from '@/components/ui';
import { proactiveHelpService, ProactiveAction } from '@/services/proactiveHelp';
import { contextAwarenessService } from '@/services/contextAwareness';

interface ProactiveSuggestionsProps {
  visible?: boolean;
  onDismiss?: () => void;
}

export const ProactiveSuggestions: React.FC<ProactiveSuggestionsProps> = ({
  visible = true,
  onDismiss,
}) => {
  const [suggestions, setSuggestions] = useState<ProactiveAction[]>([]);
  const [contextualSuggestions, setContextualSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const [proactive, contextual] = await Promise.all([
        proactiveHelpService.getSuggestions(),
        contextAwarenessService.getContextualSuggestions(),
      ]);
      setSuggestions(proactive);
      setContextualSuggestions(contextual);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: ProactiveAction) => {
    if (action.action) {
      await action.action();
      // Reload suggestions after action
      await loadSuggestions();
    }
  };

  if (!visible || (suggestions.length === 0 && contextualSuggestions.length === 0)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="star" size={20} color={colors.accent.primary} />
            <Text style={styles.title}>Size Yardımcı Olabilirim</Text>
          </View>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Contextual Suggestions */}
          {contextualSuggestions.length > 0 && (
            <View style={styles.section}>
              {contextualSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Proactive Actions */}
          {suggestions.map((action, index) => (
            <View key={index} style={styles.actionCard}>
              <View style={styles.actionHeader}>
                <Icon
                  name={getIconForType(action.type)}
                  size={24}
                  color={getColorForPriority(action.priority)}
                />
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionMessage}>{action.message}</Text>
                </View>
              </View>
              {action.action && (
                <Button
                  title="Yap"
                  onPress={() => handleAction(action)}
                  size="small"
                  variant="secondary"
                  style={styles.actionButton}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </Card>
    </View>
  );
};

const getIconForType = (type: ProactiveAction['type']): string => {
  switch (type) {
    case 'reminder':
      return 'bell';
    case 'reschedule':
      return 'calendarIcon';
    case 'break':
      return 'clock';
    case 'prepare':
      return 'star';
    case 'suggest':
      return 'star';
    case 'warn':
      return 'bell';
    default:
      return 'star';
  }
};

const getColorForPriority = (priority: ProactiveAction['priority']): string => {
  switch (priority) {
    case 'high':
      return colors.status.error;
    case 'medium':
      return colors.status.warning;
    case 'low':
      return colors.accent.primary;
    default:
      return colors.accent.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.background.secondary,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  dismissButton: {
    padding: spacing.xs,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 20,
    color: colors.text.tertiary,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: spacing.md,
  },
  suggestionItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  suggestionText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  actionCard: {
    padding: spacing.md,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  actionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  actionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  actionMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actionButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});

