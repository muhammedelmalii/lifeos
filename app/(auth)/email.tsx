import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Input, Button, useToast } from '@/components/ui';
import { useAuthStore } from '@/store';
import { t } from '@/i18n';
import { hapticFeedback } from '@/utils/haptics';

export default function EmailLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithMagicLink } = useAuthStore();
  const { showToast } = useToast();

  const handleContinue = async () => {
    if (!email.trim()) return;

    hapticFeedback.medium();
    setLoading(true);
    try {
      await signInWithMagicLink(email);
      showToast('Giriş linki e-postanıza gönderildi!', 'success');
      router.back();
    } catch (error) {
      console.error('Magic link error:', error);
      hapticFeedback.error();
      showToast(
        error instanceof Error ? error.message : 'E-posta gönderilirken bir hata oluştu',
        'error'
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>LIFEOS</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.signin')}</Text>
        <Text style={styles.subtitle}>{t('auth.assistant')}</Text>

        <Input
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          containerStyle={styles.inputContainer}
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>{t('auth.magicLink')}</Text>
        </View>

        <Button
          title={t('auth.continue')}
          onPress={handleContinue}
          loading={loading}
          disabled={!email.trim()}
          style={styles.button}
        />
      </View>

      <Text style={styles.footer}>{t('auth.securePrivate')}</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    ...typography.h3,
    color: colors.text.primary,
    marginRight: spacing.md,
  },
  logo: {
    ...typography.h3,
    color: colors.accent.primary,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.light,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoIcon: {
    marginRight: spacing.sm,
    fontSize: 16,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    flex: 1,
  },
  button: {
    marginBottom: spacing.xl,
  },
  footer: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    paddingBottom: spacing.xl,
  },
});

