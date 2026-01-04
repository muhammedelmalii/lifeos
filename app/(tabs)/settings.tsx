import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Button, Card, Icon } from '@/components/ui';
import { useAuthStore } from '@/store';
import { useSettingsStore } from '@/store';
import { t } from '@/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user, setUser } = useAuthStore();
  const { reminderIntensity, language, setLanguage, setReminderIntensity } = useSettingsStore();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSaveName = () => {
    if (nameInput.trim() && nameInput.trim() !== user?.name) {
      setUser({ ...user, name: nameInput.trim() });
    }
    setEditingName(false);
  };

  const getReminderStyleText = () => {
    switch (reminderIntensity) {
      case 'gentle':
        return 'Gentle';
      case 'persistent':
        return 'Persistent';
      case 'critical':
        return 'Critical';
      default:
        return 'Gentle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
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
                {editingName ? (
                  <View style={styles.nameEditContainer}>
                    <TextInput
                      style={styles.nameInput}
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Your name"
                      placeholderTextColor={colors.text.tertiary}
                      autoFocus
                      onSubmitEditing={handleSaveName}
                      onBlur={handleSaveName}
                    />
                    <TouchableOpacity onPress={handleSaveName} style={styles.saveButton}>
                      <Icon name="check" size={16} color={colors.accent.primary} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.nameRow}
                    onPress={() => {
                      setNameInput(user?.name || '');
                      setEditingName(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.profileName}>{user?.name || 'User'}</Text>
                    <Icon name="edit" size={14} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
                <Text style={styles.profileEmail}>{user?.email || 'No email set'}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Reminder Intensity</Text>
                <Text style={styles.settingDescription}>How strongly LifeOS interrupts your flow</Text>
              </View>
            </View>
            <View style={styles.reminderOptions}>
              {(['gentle', 'persistent', 'critical'] as const).map((intensity) => (
                <TouchableOpacity
                  key={intensity}
                  style={[
                    styles.reminderOption,
                    reminderIntensity === intensity && styles.reminderOptionActive,
                  ]}
                  onPress={() => setReminderIntensity(intensity)}
                  activeOpacity={0.7}
                >
                  <View style={styles.reminderRadio}>
                    {reminderIntensity === intensity && <View style={styles.reminderRadioInner} />}
                  </View>
                  <View style={styles.reminderOptionContent}>
                    <Text
                      style={[
                        styles.reminderOptionLabel,
                        reminderIntensity === intensity && styles.reminderOptionLabelActive,
                      ]}
                    >
                      {intensity === 'gentle' ? 'Gentle' : intensity === 'persistent' ? 'Persistent' : 'Critical'}
                    </Text>
                    <Text style={styles.reminderOptionDesc}>
                      {intensity === 'gentle'
                        ? 'Standard notifications'
                        : intensity === 'persistent'
                        ? 'Repeated alerts'
                        : 'Breaks through Do Not Disturb'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* AI Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Proactive Suggestions</Text>
                <Text style={styles.settingDescription}>Get helpful suggestions automatically</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
            </View>
            <View style={[styles.settingRow, { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.primary }]}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Wellness Insights</Text>
                <Text style={styles.settingDescription}>Monitor work-life balance</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <Card style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLanguage(language === 'en' ? 'tr' : 'en')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingDescription}>App language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>
                  {language === 'en' ? 'English' : 'Türkçe'}
                </Text>
                <Icon name="arrowRight" size={16} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Email</Text>
                <Text style={styles.settingDescription}>Your account email</Text>
              </View>
              <Text style={styles.settingValue}>{user?.email || 'Not set'}</Text>
            </View>
          </Card>
        </View>

        {/* Logout Button */}
        <Button 
          title="Sign Out" 
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
    fontSize: 28,
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
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
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
    ...shadows.sm,
  },
  profileAvatarText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
  },
  nameInput: {
    flex: 1,
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent.primary,
    paddingBottom: spacing.xs / 2,
  },
  saveButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 13,
  },
  settingCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  settingLeft: {
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  settingValue: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  reminderOptions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.primary,
    backgroundColor: colors.background.primary,
    minHeight: 60,
  },
  reminderOptionActive: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '10',
  },
  reminderRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  reminderRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent.primary,
  },
  reminderOptionContent: {
    flex: 1,
  },
  reminderOptionLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  reminderOptionLabelActive: {
    color: colors.accent.primary,
  },
  reminderOptionDesc: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: spacing.lg,
    minHeight: 48,
  },
});
