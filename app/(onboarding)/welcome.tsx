import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Button } from '@/components/ui';
import { t } from '@/i18n';
import { useSettingsStore } from '@/store';

export default function WelcomeScreen() {
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoGrid}>
              <View style={[styles.logoSquare, styles.logoSquare1]} />
              <View style={[styles.logoSquare, styles.logoSquare2]} />
              <View style={[styles.logoSquare, styles.logoSquare3]} />
              <View style={[styles.logoSquare, styles.logoSquare4]} />
            </View>
          </View>
          <Text style={styles.logoText}>LifeOS</Text>
          <Text style={styles.tagline}>OPERATING SYSTEM FOR LIFE</Text>
        </View>

        {/* 3D Visual - Cube with sphere inside, rings around */}
        <View style={styles.visualContainer}>
          <View style={styles.visual3D}>
            {/* Outer rings */}
            <View style={styles.ring2} />
            <View style={styles.ring1} />
            {/* Cube */}
            <View style={styles.cube}>
              <View style={styles.cubeFace} />
              <View style={styles.sphere} />
            </View>
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>{t('welcome.reclaim')}</Text>
        <Text style={styles.description}>{t('welcome.description')}</Text>

        {/* Primary CTA */}
        <Button
          title={t('welcome.getStarted')}
          onPress={() => router.push('/(onboarding)/permissions')}
          style={styles.button}
          variant="primary"
        />

        {/* Social Login Buttons */}
        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.socialIcon}>🍎</Text>
            <Text style={styles.socialText}>Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginText}>{t('auth.alreadyAccount')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 1.5,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.accent.primary,
    marginBottom: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  logoSquare: {
    width: '48%',
    height: '48%',
    backgroundColor: colors.background.primary,
    margin: '1%',
    borderRadius: 4,
  },
  logoSquare1: {
    opacity: 0.4,
  },
  logoSquare2: {
    opacity: 0.3,
  },
  logoSquare3: {
    opacity: 0.3,
  },
  logoSquare4: {
    opacity: 0.4,
  },
  logoText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  tagline: {
    ...typography.caption,
    color: colors.text.tertiary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    height: 280,
    justifyContent: 'center',
  },
  visual3D: {
    width: 280,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
    opacity: 0.15,
  },
  ring1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    opacity: 0.25,
  },
  cube: {
    width: 140,
    height: 140,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  cubeFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent.primary,
    opacity: 0.1,
  },
  sphere: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent.primary,
    opacity: 0.7,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headline: {
    ...typography.h1,
    fontSize: 36,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '700',
    letterSpacing: -1,
  },
  description: {
    ...typography.body,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  button: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    minWidth: 120,
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  socialText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  loginText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

