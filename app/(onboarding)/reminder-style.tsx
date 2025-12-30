import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, ProgressDots, Icon } from '@/components/ui';
import { ReminderStyle } from '@/types';
import { t } from '@/i18n';
import { useSettingsStore } from '@/store';

export default function ReminderStyleScreen() {
  const router = useRouter();
  const { setReminderStyle } = useSettingsStore();
  const [selectedStyle, setSelectedStyle] = useState<ReminderStyle>('gentle');

  const handleSave = async () => {
    await setReminderStyle(selectedStyle);
    router.push('/(onboarding)/widget');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Notification Style</Text>
          <View style={styles.progressContainer}>
            <ProgressDots total={5} current={4} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.headline}>{t('onboarding.reminderIntensity')}</Text>
          <Text style={styles.description}>{t('onboarding.reminderDesc')}</Text>

        <View style={styles.optionsList}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedStyle === 'gentle' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedStyle('gentle')}
          >
            <View style={styles.optionHeader}>
              <View>
                <Text style={styles.optionTitle}>{t('onboarding.gentle')}</Text>
                <Text style={styles.optionDesc}>{t('onboarding.gentleDesc')}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedStyle === 'gentle' && styles.radioButtonSelected,
                ]}
              />
            </View>
            <View style={styles.notificationExample}>
              <View style={styles.notificationIcon} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationApp}>LifeOS</Text>
                <Text style={styles.notificationText}>Time for your daily review.</Text>
              </View>
              <Text style={styles.notificationTime}>Now</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedStyle === 'persistent' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedStyle('persistent')}
          >
            <View style={styles.optionHeader}>
              <View>
                <Text style={styles.optionTitle}>{t('onboarding.persistent')}</Text>
                <Text style={styles.optionDesc}>{t('onboarding.persistentDesc')}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedStyle === 'persistent' && styles.radioButtonSelected,
                ]}
              />
            </View>
            <View style={styles.notificationExample}>
              <View style={[styles.notificationIcon, styles.notificationIconPurple]} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationApp}>LifeOS</Text>
                <Text style={styles.notificationText}>
                  Meeting: Strategy alignment starts in 5 min.
                </Text>
              </View>
              <Text style={styles.notificationTime}>2m ago</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedStyle === 'critical' && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedStyle('critical')}
          >
            <View style={styles.optionHeader}>
              <View>
                <Text style={styles.optionTitle}>{t('onboarding.critical')}</Text>
                <Text style={styles.optionDesc}>{t('onboarding.criticalDesc')}</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  selectedStyle === 'critical' && styles.radioButtonSelected,
                ]}
              />
            </View>
            <View style={styles.notificationExample}>
              <View style={[styles.notificationIcon, styles.notificationIconRed]} />
              <View style={styles.notificationContent}>
                <Text style={styles.notificationApp}>CRITICAL ALERT</Text>
                <Text style={styles.notificationText}>Missed Medication. Take immediately.</Text>
              </View>
              <Text style={styles.notificationTime}>Now</Text>
            </View>
          </TouchableOpacity>
        </View>

          {/* Save Button */}
          <Button
            title={t('onboarding.save')}
            onPress={handleSave}
            style={styles.button}
            variant="primary"
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headline: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  optionsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  optionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  optionCardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.light,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  optionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  radioButtonSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary,
  },
  notificationExample: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: spacing.sm,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    marginRight: spacing.sm,
  },
  notificationIconPurple: {
    backgroundColor: '#a855f7',
  },
  notificationIconRed: {
    backgroundColor: colors.status.error,
  },
  notificationContent: {
    flex: 1,
  },
  notificationApp: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing.xs / 2,
  },
  notificationText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  notificationTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  button: {
    marginTop: spacing.xl,
  },
});

