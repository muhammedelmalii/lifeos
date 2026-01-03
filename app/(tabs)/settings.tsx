import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useSettingsStore } from '@/store';
import { t } from '@/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { reminderIntensity, language, setLanguage } = useSettingsStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getReminderStyleText = () => {
    switch (reminderIntensity) {
      case 'gentle':
        return t('onboarding.gentle');
      case 'persistent':
        return t('onboarding.persistent');
      case 'critical':
        return t('onboarding.critical');
      default:
        return t('onboarding.gentle');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('settings.title')}</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {(user?.name || user?.email || 'U')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name || 'Kullanıcı'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'Email ayarlanmamış'}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>{t('settings.email')}</Text>
            <Text style={styles.settingValue}>{user?.email || 'Not set'}</Text>
          </Card>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Card style={styles.settingCard}>
            <TouchableOpacity
              style={styles.languageRow}
              onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>{t('settings.language')}</Text>
              <View style={styles.languageValue}>
                <Text style={styles.settingValue}>
                  {language === 'en' ? 'English' : 'Türkçe'}
                </Text>
                <Text style={styles.languageChange}>Değiştir →</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>{t('settings.reminderIntensity')}</Text>
            <Text style={styles.settingValue}>{getReminderStyleText()}</Text>
          </Card>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
          <Card style={styles.settingCard}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => {
                // TODO: Replace with actual Privacy Policy URL
                Linking.openURL('https://your-domain.com/privacy-policy').catch(console.error);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.linkText}>→</Text>
            </TouchableOpacity>
          </Card>
          <Card style={styles.settingCard}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => {
                // TODO: Replace with actual Terms of Service URL
                Linking.openURL('https://your-domain.com/terms-of-service').catch(console.error);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Text style={styles.linkText}>→</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout Button */}
        <Button 
          title={t('settings.signOut')} 
          onPress={handleLogout} 
          variant="secondary" 
          style={styles.logoutButton} 
        />
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
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    fontWeight: '700',
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  settingCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 12,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  settingValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  languageChange: {
    ...typography.bodySmall,
    color: colors.accent.primary,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    ...typography.body,
    color: colors.accent.primary,
  },
  profileCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  profileAvatarText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
    fontWeight: '600',
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

