import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Button, Card, ProgressDots, Icon } from '@/components/ui';
import { t } from '@/i18n';

export default function WidgetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('onboarding.widgetSetup')}</Text>
          <View style={styles.progressContainer}>
            <ProgressDots total={5} current={5} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Widget Preview */}
          <View style={styles.widgetPreview}>
            <Card style={styles.widgetCard}>
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetLabel}>FOCUS</Text>
                <Icon name="play" size={16} color={colors.accent.primary} />
              </View>
              <Text style={styles.widgetTitle}>Deep Work</Text>
              <View style={styles.widgetChart}>
                <View style={styles.chartBar} />
                <View style={styles.chartBar} />
                <View style={styles.chartBar} />
                <View style={styles.chartBar} />
              </View>
              <Text style={styles.widgetNext}>Next: Strategy Sync</Text>
            </Card>
            <Text style={styles.previewLabel}>Preview</Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>Instructions</Text>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>👆</Text>
              <Text style={styles.stepText}>{t('onboarding.widgetStep1')}</Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>+</Text>
              <Text style={styles.stepText}>{t('onboarding.widgetStep2')}</Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepIcon}>🔍</Text>
              <Text style={styles.stepText}>{t('onboarding.widgetStep3')}</Text>
            </View>
          </View>

          {/* Done Button */}
          <Button
            title={t('onboarding.done')}
            onPress={() => router.replace('/(tabs)/home')}
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
  cancelButton: {
    width: 80,
  },
  cancelText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  progressContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  widgetPreview: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  widgetCard: {
    width: '100%',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  widgetLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  widgetTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  widgetChart: {
    height: 60,
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    padding: spacing.xs,
    gap: spacing.xs,
  },
  chartBar: {
    flex: 1,
    backgroundColor: colors.accent.primary,
    borderRadius: 4,
    minHeight: 20,
    maxHeight: 50,
  },
  widgetNext: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  previewLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  instructions: {
    marginBottom: spacing.xl,
  },
  instructionsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  stepIcon: {
    fontSize: 24,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  stepText: {
    ...typography.body,
    color: colors.text.secondary,
    flex: 1,
  },
  button: {
    marginTop: spacing.xl,
  },
});

