import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Chip, Icon } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime, getTomorrowMorning, getTonight, addHours } from '@/utils/date';
import { Responsibility } from '@/types';
import { t } from '@/i18n';
import { hapticFeedback } from '@/utils/haptics';
import { useToast } from '@/components/ui';

export default function ResponsibilityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { responsibilities, updateResponsibility, loadResponsibilities } = useResponsibilitiesStore();
  const { showToast } = useToast();
  const [responsibility, setResponsibility] = useState<Responsibility | null>(null);

  useEffect(() => {
    const resp = responsibilities.find((r) => r.id === id);
    setResponsibility(resp || null);
  }, [id, responsibilities]);

  if (!responsibility) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Responsibility not found</Text>
      </View>
    );
  }

  const handleComplete = async () => {
    hapticFeedback.success();
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
    showToast('Görev tamamlandı!', 'success');
    await loadResponsibilities();
    router.back();
  };

  const handleSnooze = async (until: Date) => {
    hapticFeedback.medium();
    await updateResponsibility(id, { status: 'snoozed', snoozedUntil: until });
    showToast('Görev ertelendi', 'info');
    await loadResponsibilities();
    router.back();
  };

  const handleCouldntDoIt = () => {
    hapticFeedback.medium();
    router.push(`/couldnt-do-it/${id}`);
  };

  const handleChecklistToggle = async (checklistId: string) => {
    hapticFeedback.light();
    const updatedChecklist = responsibility.checklist.map((item) =>
      item.id === checklistId ? { ...item, done: !item.done } : item
    );
    await updateResponsibility(id, { checklist: updatedChecklist });
    await loadResponsibilities();
  };

  const completedCount = responsibility.checklist.filter((item) => item.done).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('responsibility.title')}</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Chip
            label={responsibility.energyRequired.toUpperCase() + ' ENERGY'}
            variant={`energy_${responsibility.energyRequired}` as any}
            style={styles.energyChip}
          />
          <Text style={styles.title}>{responsibility.title}</Text>
          {responsibility.description && (
            <Text style={styles.description}>{responsibility.description}</Text>
          )}
        </View>

        {/* Checklist Section */}
        {responsibility.checklist.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('responsibility.checklist')}</Text>
              <Text style={styles.sectionSubtitle}>
                {t('responsibility.completed', {
                  done: completedCount,
                  total: responsibility.checklist.length,
                })}
              </Text>
            </View>
            {responsibility.checklist.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => handleChecklistToggle(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.done && styles.checkboxChecked,
                  ]}
                >
                  {item.done && <Icon name="check" size={16} color={colors.text.primary} />}
                </View>
                <Text
                  style={[
                    styles.checklistLabel,
                    item.done && styles.checklistLabelDone,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('responsibility.schedule')}</Text>
          <Card style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleLeft}>
                <Text style={styles.scheduleLabel}>{t('responsibility.nextOccurrence')}</Text>
                <Text style={styles.scheduleValue}>
                  {formatDateTime(responsibility.schedule.datetime)}
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Icon name="edit" size={18} color={colors.accent.primary} />
                <Text style={styles.editLink}>{t('responsibility.edit')}</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Text style={styles.quickSnoozeLabel}>{t('responsibility.quickSnooze')}</Text>
          <View style={styles.snoozeButtons}>
            <Button
              title="1 hour"
              size="small"
              variant="secondary"
              onPress={() => handleSnooze(addHours(new Date(), 1))}
            />
            <Button
              title="Tonight"
              size="small"
              variant="secondary"
              onPress={() => handleSnooze(getTonight())}
            />
            <Button
              title="Tomorrow"
              size="small"
              variant="secondary"
              onPress={() => handleSnooze(getTomorrowMorning())}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('responsibility.markDone')}
            onPress={handleComplete}
            style={styles.actionButton}
            variant="primary"
          />
          <Button
            title={t('responsibility.couldntDo')}
            onPress={handleCouldntDoIt}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuButtonText: {
    ...typography.h3,
    color: colors.text.primary,
    fontSize: 24,
  },
  titleSection: {
    marginBottom: spacing.xl,
  },
  energyChip: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.primary,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  checkmark: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checklistLabel: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  checklistLabelDone: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  scheduleCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...shadows.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleLeft: {
    flex: 1,
  },
  scheduleLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  scheduleValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editLink: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '500',
  },
  quickSnoozeLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  snoozeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.h3,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.lg,
    minWidth: 120,
  },
});

