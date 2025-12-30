import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Button, Switch, ProgressDots, Icon } from '@/components/ui';
import { requestPermissions as requestNotificationPermissions } from '@/services/notifications';
import { requestCalendarPermissions } from '@/services/calendar';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { t } from '@/i18n';

export default function PermissionsScreen() {
  const router = useRouter();
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [photosEnabled, setPhotosEnabled] = useState(false);

  const handleCalendarToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestCalendarPermissions();
      setCalendarEnabled(granted);
    } else {
      setCalendarEnabled(false);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleMicrophoneToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Audio.requestPermissionsAsync();
      setMicrophoneEnabled(status === 'granted');
    } else {
      setMicrophoneEnabled(false);
    }
  };

  const handlePhotosToggle = async (value: boolean) => {
    if (value) {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setPhotosEnabled(status === 'granted');
    } else {
      setPhotosEnabled(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header with Progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrowLeft" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Setup</Text>
          <View style={styles.progressContainer}>
            <ProgressDots total={5} current={2} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.headline}>{t('onboarding.connect')}</Text>
          <Text style={styles.description}>{t('onboarding.description')}</Text>

          {/* Permissions List */}
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <View style={styles.permissionLeft}>
                <View style={styles.permissionIconContainer}>
                  <Icon name="calendarIcon" size={24} color={colors.accent.primary} />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>{t('onboarding.calendar')}</Text>
                  <Text style={styles.permissionDesc}>{t('onboarding.calendarDesc')}</Text>
                </View>
              </View>
              <Switch
                value={calendarEnabled}
                onValueChange={handleCalendarToggle}
              />
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionLeft}>
                <View style={styles.permissionIconContainer}>
                  <Icon name="bell" size={24} color={colors.accent.primary} />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>{t('onboarding.notifications')}</Text>
                  <Text style={styles.permissionDesc}>{t('onboarding.notificationsDesc')}</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationsToggle}
              />
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionLeft}>
                <View style={styles.permissionIconContainer}>
                  <Icon name="microphone" size={24} color={colors.accent.primary} />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>{t('onboarding.microphone')}</Text>
                  <Text style={styles.permissionDesc}>{t('onboarding.microphoneDesc')}</Text>
                </View>
              </View>
              <Switch
                value={microphoneEnabled}
                onValueChange={handleMicrophoneToggle}
              />
            </View>

            <View style={styles.permissionItem}>
              <View style={styles.permissionLeft}>
                <View style={styles.permissionIconContainer}>
                  <Icon name="camera" size={24} color={colors.accent.primary} />
                </View>
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>{t('onboarding.photos')}</Text>
                  <Text style={styles.permissionDesc}>{t('onboarding.photosDesc')}</Text>
                </View>
              </View>
              <Switch
                value={photosEnabled}
                onValueChange={handlePhotosToggle}
              />
            </View>
          </View>

          {/* Privacy Footer */}
          <View style={styles.privacyBox}>
            <Icon name="lock" size={16} color={colors.accent.primary} />
            <Text style={styles.privacyText}>{t('onboarding.private')}</Text>
          </View>

          {/* Actions */}
          <Button
            title={t('onboarding.continue')}
            onPress={() => router.push('/(onboarding)/calendar')}
            style={styles.button}
            variant="primary"
          />
          <TouchableOpacity 
            onPress={() => router.push('/(onboarding)/calendar')}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
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
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.tertiary,
  },
  progressDotActive: {
    backgroundColor: colors.accent.primary,
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
  permissionsList: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: spacing.md,
  },
  permissionIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  permissionTextContainer: {
    flex: 1,
  },
  permissionTitle: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  permissionDesc: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  privacyIcon: {
    marginRight: spacing.xs,
  },
  privacyText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  button: {
    marginBottom: spacing.md,
    width: '100%',
  },
  skipButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

