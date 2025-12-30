import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Icon, ProgressDots } from '@/components/ui';
import { t } from '@/i18n';

export default function CalendarScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Sync Calendars</Text>
          <View style={styles.progressContainer}>
            <ProgressDots total={5} current={3} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.headline}>{t('onboarding.connectWorld')}</Text>
          <Text style={styles.description}>{t('onboarding.calendarNeed')}</Text>

          {/* AI Suggestion Box */}
          <Card style={styles.featureBox}>
            <Icon name="star" size={20} color={colors.accent.primary} />
            <Text style={styles.featureText}>{t('onboarding.conflict')}</Text>
          </Card>

          {/* Calendar List */}
          <View style={styles.calendarsList}>
            <Card style={styles.calendarItem}>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>G</Text>
              </View>
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarName}>Google Calendar</Text>
                <Text style={styles.calendarStatus}>{t('onboarding.notConnected')}</Text>
              </View>
              <Button 
                title={t('onboarding.connectButton')} 
                size="small" 
                variant="secondary" 
                onPress={() => {}} 
              />
            </Card>

            <Card style={styles.calendarItem}>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>☁️</Text>
              </View>
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarName}>iCloud Calendar</Text>
                <Text style={styles.calendarStatus}>{t('onboarding.notConnected')}</Text>
              </View>
              <Button 
                title={t('onboarding.connectButton')} 
                size="small" 
                variant="secondary" 
                onPress={() => {}} 
              />
            </Card>

            <Card style={styles.calendarItem}>
              <View style={styles.calendarIcon}>
                <Text style={styles.calendarIconText}>O</Text>
              </View>
              <View style={styles.calendarInfo}>
                <Text style={styles.calendarName}>Outlook</Text>
                <Text style={styles.calendarStatus}>{t('onboarding.notConnected')}</Text>
              </View>
              <Button 
                title={t('onboarding.connectButton')} 
                size="small" 
                variant="secondary" 
                onPress={() => {}} 
              />
            </Card>
          </View>

          {/* Privacy Footer */}
          <View style={styles.privacyBox}>
            <Icon name="lock" size={14} color={colors.accent.primary} />
            <Text style={styles.privacyText}>{t('onboarding.secure')}</Text>
          </View>

          {/* Skip Button */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={() => router.push('/(onboarding)/reminder-style')}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
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
    marginBottom: spacing.lg,
  },
  featureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.light,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    flex: 1,
  },
  calendarsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  calendarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.sm,
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  calendarIconText: {
    ...typography.h3,
    color: colors.text.primary,
  },
  calendarInfo: {
    flex: 1,
  },
  calendarName: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  calendarStatus: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  privacyIcon: {
    marginRight: spacing.xs,
  },
  privacyText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    ...typography.body,
    color: colors.text.tertiary,
  },
});

