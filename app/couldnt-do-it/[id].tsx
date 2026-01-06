import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Icon } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { getTomorrowMorning } from '@/utils/date';
import { t } from '@/i18n';
import { hapticFeedback } from '@/utils/haptics';
import { useToast } from '@/components/ui';

export default function CouldntDoItScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { updateResponsibility, loadResponsibilities } = useResponsibilitiesStore();
  const { showToast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const reasons = [
    { id: 'no-time', label: 'No Time', icon: '⏰' },
    { id: 'low-energy', label: 'Low Energy', icon: '🔋' },
    { id: 'forgot', label: 'Slipped my mind', icon: '🧠' },
    { id: 'priority', label: 'Something came up', icon: '↕️' },
  ];

  const handleReschedule = async () => {
    hapticFeedback.success();
    const tomorrow = getTomorrowMorning();
    await updateResponsibility(id, {
      status: 'active',
      schedule: {
        type: 'one-time',
        datetime: tomorrow,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      snoozedUntil: undefined,
    });
    showToast('Görev yarına ertelendi', 'success');
    await loadResponsibilities();
    router.back();
  };

  const handleArchive = async () => {
    hapticFeedback.medium();
    await updateResponsibility(id, { status: 'archived' });
    showToast('Görev arşivlendi', 'info');
    await loadResponsibilities();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
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
        </View>

        {/* Content */}
        <Text style={styles.headline}>{t('couldntDo.title')}</Text>
        <Text style={styles.subtitle}>{t('couldntDo.subtitle')}</Text>

        {/* Reasons Grid */}
        <View style={styles.reasonsGrid}>
          <TouchableOpacity
            style={[
              styles.reasonButton,
              selectedReason === 'no-time' && styles.reasonButtonSelected,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedReason('no-time');
            }}
            activeOpacity={0.7}
          >
            <Icon name="clock" size={32} color={selectedReason === 'no-time' ? colors.accent.primary : colors.text.primary} />
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === 'no-time' && styles.reasonLabelSelected,
              ]}
            >
              {t('couldntDo.noTime')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reasonButton,
              selectedReason === 'low-energy' && styles.reasonButtonSelected,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedReason('low-energy');
            }}
            activeOpacity={0.7}
          >
            <Icon name="battery" size={32} color={selectedReason === 'low-energy' ? colors.accent.primary : colors.text.primary} />
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === 'low-energy' && styles.reasonLabelSelected,
              ]}
            >
              {t('couldntDo.lowEnergy')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reasonButton,
              selectedReason === 'forgot' && styles.reasonButtonSelected,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedReason('forgot');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.reasonIcon}>🧠</Text>
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === 'forgot' && styles.reasonLabelSelected,
              ]}
            >
              {t('couldntDo.forgot')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.reasonButton,
              selectedReason === 'priority' && styles.reasonButtonSelected,
            ]}
            onPress={() => {
              hapticFeedback.selection();
              setSelectedReason('priority');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.reasonIcon}>↕️</Text>
            <Text
              style={[
                styles.reasonLabel,
                selectedReason === 'priority' && styles.reasonLabelSelected,
              ]}
            >
              {t('couldntDo.priority')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Suggestion Box */}
        <Card style={styles.suggestionBox}>
          <Icon name="star" size={20} color={colors.accent.primary} />
          <Text style={styles.suggestionText}>{t('couldntDo.suggestion')}</Text>
        </Card>

        {/* Actions */}
        <Button
          title={t('couldntDo.reschedule')}
          onPress={handleReschedule}
          style={styles.rescheduleButton}
          variant="primary"
        />
        <TouchableOpacity onPress={handleArchive} style={styles.archiveButton}>
          <Text style={styles.archiveLink}>{t('couldntDo.archive')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headline: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  reasonButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.primary,
    padding: spacing.md,
    ...shadows.sm,
  },
  reasonButtonSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.light,
  },
  reasonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  reasonLabel: {
    ...typography.body,
    color: colors.text.primary,
    textAlign: 'center',
  },
  reasonLabelSelected: {
    color: colors.accent.primary,
    fontWeight: '600',
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
  rescheduleButton: {
    marginBottom: spacing.md,
    width: '100%',
  },
  archiveButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  archiveLink: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

