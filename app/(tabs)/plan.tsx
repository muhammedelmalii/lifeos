import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/theme';
import { t } from '@/i18n';

export default function PlanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Plan</Text>
        <Text style={styles.subtitle}>Calendar view coming soon</Text>
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
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

