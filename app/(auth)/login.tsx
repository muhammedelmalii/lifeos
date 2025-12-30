import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { useAuthStore } from '@/store';
import { t } from '@/i18n';
import { Icon } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleAppleLogin = async () => {
    try {
      setLoading('apple');
      await signInWithApple();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Apple login error:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading('google');
      await signInWithGoogle();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Google login error:', error);
      // TODO: Show error message to user
    } finally {
      setLoading(null);
    }
  };

  const handleEmailLogin = () => {
    router.push('/(auth)/email');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Icon - 4 squares grid */}
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <View style={styles.iconGrid}>
              <View style={styles.iconSquare} />
              <View style={styles.iconSquare} />
              <View style={styles.iconSquare} />
              <View style={styles.iconSquare} />
            </View>
          </View>
        </View>

        {/* Title Section */}
        <Text style={styles.title}>{t('auth.secure')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

        {/* Social Login Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.socialButton, loading === 'apple' && styles.socialButtonDisabled]} 
            onPress={handleAppleLogin}
            activeOpacity={0.7}
            disabled={loading !== null}
          >
            <Icon name="apple" size={20} color={colors.background.primary} />
            <Text style={styles.socialButtonText}>
              {loading === 'apple' ? '...' : t('auth.apple')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.socialButton, loading === 'google' && styles.socialButtonDisabled]} 
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
            disabled={loading !== null}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialButtonText}>
              {loading === 'google' ? '...' : t('auth.google')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton} 
            onPress={handleEmailLogin}
            activeOpacity={0.7}
          >
            <Icon name="search" size={18} color={colors.background.primary} />
            <Text style={styles.socialButtonText}>{t('auth.email')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Icon name="lock" size={14} color={colors.accent.primary} />
            <Text style={styles.footerText}>{t('auth.encrypted')}</Text>
          </View>
          <Text style={styles.footerSubtext}>{t('auth.privacy')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
  },
  icon: {
    width: 64,
    height: 64,
    marginBottom: spacing.lg,
  },
  iconGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  iconSquare: {
    width: '48%',
    height: '48%',
    backgroundColor: colors.accent.primary,
    borderRadius: 6,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl * 1.5,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  buttonContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl * 1.5,
  },
  socialButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
    minHeight: 56,
    gap: spacing.sm,
  },
  socialButtonText: {
    ...typography.button,
    color: colors.background.primary,
    fontWeight: '600',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.background.primary,
    width: 20,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  footerText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.accent.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerSubtext: {
    ...typography.captionSmall,
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
});

