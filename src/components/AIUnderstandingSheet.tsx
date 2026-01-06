import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Chip, Icon } from '@/components/ui';
import { ParsedCommand } from '@/services/aiParser';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { List } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { scheduleResponsibilityNotifications } from '@/services/notifications';
import { createCalendarEvent } from '@/services/calendar';
import { formatDateTime, getTomorrowMorning } from '@/utils/date';
import { t } from '@/i18n';
import { useToast } from '@/components/ui';
import { hapticFeedback } from '@/utils/haptics';

interface AIUnderstandingSheetProps {
  visible: boolean;
  onClose: () => void;
  parsedCommand: ParsedCommand;
  originalText: string;
  createdFrom: 'text' | 'voice' | 'photo';
}

export const AIUnderstandingSheet: React.FC<AIUnderstandingSheetProps> = ({
  visible,
  onClose,
  parsedCommand,
  originalText,
  createdFrom,
}) => {
  const { addResponsibility } = useResponsibilitiesStore();
  const { updateList, loadLists } = useListsStore();

  const handleConfirm = async () => {
    // 1. Create the responsibility
    const responsibility = {
      id: uuidv4(),
      title: parsedCommand.title,
      description: parsedCommand.description || originalText,
      category: parsedCommand.category, // Auto-categorized by GPT
      energyRequired: parsedCommand.energyRequired || 'medium',
      schedule: parsedCommand.schedule || {
        type: 'one-time' as const,
        datetime: getTomorrowMorning(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminderStyle: parsedCommand.reminderStyle || 'gentle',
      escalationRules: [
        { offsetMinutes: 15, channel: 'notification' as const, strength: 'gentle' as const },
      ],
      status: 'active' as const,
      checklist: [],
      createdFrom: createdFrom,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Ensure date is in the future
    if (responsibility.schedule && responsibility.schedule.datetime) {
      const now = new Date();
      if (responsibility.schedule.datetime < now) {
        // Move to tomorrow at same time, or tomorrow 10 AM if time is in the past
        const tomorrow = getTomorrowMorning();
        const originalTime = responsibility.schedule.datetime;
        tomorrow.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
        if (tomorrow < now) {
          responsibility.schedule.datetime = getTomorrowMorning();
        } else {
          responsibility.schedule.datetime = tomorrow;
        }
      }
    }

    // 2. Create calendar event if schedule exists
    let calendarEventId: string | null = null;
    if (responsibility.schedule && responsibility.schedule.datetime) {
      try {
        calendarEventId = await createCalendarEvent(responsibility);
        if (calendarEventId) {
          responsibility.calendarEventId = calendarEventId;
        }
      } catch (error) {
        console.error('Failed to create calendar event:', error);
        // Continue without calendar event
      }
    }

    // 3. Add responsibility (with calendar event ID if created)
    await addResponsibility(responsibility);
    await scheduleResponsibilityNotifications(responsibility);

    // 2. Process list actions if any
    if (parsedCommand.listActions && parsedCommand.listActions.length > 0) {
      // Ensure lists are loaded
      await loadLists();
      
      for (const listAction of parsedCommand.listActions) {
        // Find existing list by name (case-insensitive)
        const existingList = useListsStore.getState().lists.find(
          l => l.name.toLowerCase() === listAction.listName.toLowerCase()
        );

        if (existingList) {
          // Add items to existing list
          const newItems = listAction.items.map(item => ({
            id: uuidv4(),
            label: item,
            category: '',
            checked: false,
            createdAt: new Date(),
          }));

          const updatedItems = [...existingList.items, ...newItems];
          await updateList(existingList.id, { items: updatedItems });
        } else {
          // Create new list if it doesn't exist
          const newList: List = {
            id: uuidv4(),
            name: listAction.listName,
            type: 'custom',
            items: listAction.items.map(item => ({
              id: uuidv4(),
              label: item,
              category: '',
              checked: false,
              createdAt: new Date(),
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await useListsStore.getState().addList(newList);
        }
      }
    }

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon name="star" size={20} color={colors.accent.primary} />
              <Text style={styles.headerTitle}>{t('ai.assistant')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.understoodLabel}>{t('ai.understood')}</Text>
            <Text style={styles.understoodText}>{parsedCommand.title}</Text>
            <Text style={styles.confirmationHint}>
              Doğru mu? Onaylarsan takip edeceğim.
            </Text>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <Card style={styles.detailCard}>
                <Icon name="calendarIcon" size={24} color={colors.accent.primary} />
                <Text style={styles.detailLabel}>{t('ai.when')}</Text>
                <Text style={styles.detailValue}>
                  {parsedCommand.schedule && parsedCommand.schedule.datetime
                    ? formatDateTime(parsedCommand.schedule.datetime)
                    : 'Not set'}
                </Text>
              </Card>

              <Card style={styles.detailCard}>
                <Icon name="clock" size={24} color={colors.accent.primary} />
                <Text style={styles.detailLabel}>{t('ai.repeat')}</Text>
                <Text style={styles.detailValue}>
                  {parsedCommand.recurring ? 'Weekly Mon, Wed' : 'One-time'}
                </Text>
              </Card>

              <Card style={styles.detailCard}>
                <Icon name="energy" size={24} color={colors.accent.primary} />
                <Text style={styles.detailLabel}>{t('ai.priority')}</Text>
                <View style={styles.chipContainer}>
                  <Chip
                    label={parsedCommand.reminderStyle === 'critical' ? 'High' : 'Normal'}
                    variant={
                      parsedCommand.reminderStyle === 'critical' ? 'energy_high' : 'default'
                    }
                  />
                </View>
              </Card>

              <Card style={styles.detailCard}>
                <Icon name="bell" size={24} color={colors.accent.primary} />
                <Text style={styles.detailLabel}>{t('ai.mode')}</Text>
                <Text style={styles.detailValue}>
                  {parsedCommand.reminderStyle === 'gentle'
                    ? 'Gentle Soft vibration'
                    : parsedCommand.reminderStyle === 'persistent'
                    ? 'Persistent'
                    : 'Critical'}
                </Text>
              </Card>
            </View>

            {/* Suggestion Box */}
            {parsedCommand.listActions && parsedCommand.listActions.length > 0 && (
              <Card style={styles.suggestionBox}>
                <Icon name="star" size={20} color={colors.accent.primary} />
                <Text style={styles.suggestionText}>
                  I've also added "Wine" and "Cheese" to your shopping list based on your past
                  dinner parties.
                </Text>
              </Card>
            )}

            {/* Actions */}
            <Button 
              title={t('ai.confirm')} 
              onPress={handleConfirm} 
              style={styles.confirmButton}
              variant="primary"
            />
            <TouchableOpacity onPress={onClose} style={styles.actionLink}>
              <Icon name="check" size={16} color={colors.accent.primary} />
              <Text style={styles.editLink}>{t('ai.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.actionLink}>
              <Text style={styles.editLink}>{t('ai.ask')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const getWindowHeight = () => {
  try {
    return Dimensions.get('window').height;
  } catch {
    return 800; // Fallback height
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: getWindowHeight() * 0.9,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  suggestionBox: {
    backgroundColor: colors.accent.light,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 0,
    ...shadows.sm,
  },
  suggestionText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  understoodLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  understoodText: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  confirmationHint: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  detailCard: {
    width: '47%',
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 12,
    ...shadows.sm,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  chipContainer: {
    marginTop: spacing.xs,
  },
  confirmButton: {
    marginBottom: spacing.md,
    width: '100%',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  editLink: {
    ...typography.body,
    color: colors.accent.primary,
    fontWeight: '500',
  },
});

