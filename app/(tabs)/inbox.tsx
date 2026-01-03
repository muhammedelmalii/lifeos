import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, SectionHeader, Badge, Icon, EmptyState } from '@/components/ui';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { t } from '@/i18n';

type BriefingType = 'morning' | 'evening';

export default function InboxScreen() {
  const router = useRouter();
  const { 
    getMissed, 
    getSnoozed, 
    getUpcoming, 
    loadResponsibilities, 
    updateResponsibility,
    responsibilities,
    checkStateTransitions
  } = useResponsibilitiesStore();
  
  const [briefingType, setBriefingType] = useState<BriefingType>('morning');

  useEffect(() => {
    loadResponsibilities();
    checkStateTransitions();
    // Determine briefing type based on time of day
    const hour = new Date().getHours();
    setBriefingType(hour < 12 ? 'morning' : 'evening');
  }, []);

  const missed = getMissed();
  const snoozed = getSnoozed();
  const upcoming = getUpcoming();
  const critical = upcoming.filter((r) => r.reminderStyle === 'critical');
  
  const completed = responsibilities.filter((r) => r.status === 'completed' && r.completedAt);
  const todayCompleted = completed.filter((r) => {
    if (!r.completedAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedDate = new Date(r.completedAt);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  });

  const handleComplete = async (id: string) => {
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
  };

  const hasContent = missed.length > 0 || snoozed.length > 0 || upcoming.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {briefingType === 'morning' ? '📋 Bugün' : '📋 Özet'}
          </Text>
          {hasContent && (
            <Text style={styles.subtitle}>
              {missed.length + upcoming.length} sorumluluk
            </Text>
          )}
        </View>

        {/* Evening: Today's Completed (only in evening) */}
        {briefingType === 'evening' && todayCompleted.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="✅ Tamamlanan" />
            {todayCompleted.slice(0, 3).map((item) => (
              <Card key={item.id} style={styles.compactCard}>
                <Text style={styles.compactTitle}>{item.title}</Text>
                {item.completedAt && (
                  <Text style={styles.compactMeta}>
                    {formatDateTime(item.completedAt).split(' ')[1]}'de tamamlandı
                  </Text>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Missed Critical - Always show if exists */}
        {missed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="⚠️ Kaçırılan"
              action={<Badge label={`${missed.length}`} variant="error" />}
            />
            {missed.slice(0, 3).map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => await handleComplete(item.id)}
                onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.compactCard}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.compactTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.compactMeta}>
                          {item.category || 'General'} • {formatDateTime(item.schedule.datetime).split(' ')[1] || '2:00 PM'}
                        </Text>
                      </View>
                      <Button
                        title="✓"
                        onPress={() => handleComplete(item.id)}
                        size="small"
                        variant="primary"
                        style={styles.quickButton}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Critical Today (morning only) */}
        {briefingType === 'morning' && critical.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="🔥 Kritik" />
            {critical.slice(0, 3).map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => await handleComplete(item.id)}
                onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={[styles.compactCard, styles.criticalCard]}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.compactTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.compactMeta}>
                          {formatDateTime(item.schedule.datetime).split(' ')[1] || '2:00 PM'}
                        </Text>
                      </View>
                      <Button
                        title="✓"
                        onPress={() => handleComplete(item.id)}
                        size="small"
                        variant="primary"
                        style={styles.quickButton}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Snoozed Items */}
        {snoozed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="⏸️ Ertelenen" />
            {snoozed.slice(0, 3).map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => await handleComplete(item.id)}
                onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.compactCard}>
                    <View style={styles.cardContent}>
                      <Icon name="bell" size={16} color={colors.accent.primary} />
                      <View style={styles.cardLeft}>
                        <Text style={styles.compactTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.compactMeta}>
                          {item.snoozedUntil
                            ? formatDateTime(item.snoozedUntil)
                            : formatDateTime(item.schedule.datetime)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="📅 Yaklaşan" />
            {upcoming.slice(0, 5).map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => await handleComplete(item.id)}
                onSwipeLeft={() => router.push(`/couldnt-do-it/${item.id}`)}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.compactCard}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.compactTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.compactMeta}>
                          {formatDateTime(item.schedule.datetime).split(' ')[1] || '2:00 PM'}
                        </Text>
                      </View>
                      <Button
                        title="✓"
                        onPress={() => handleComplete(item.id)}
                        size="small"
                        variant="secondary"
                        style={styles.quickButton}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Evening Reflection (only in evening) */}
        {briefingType === 'evening' && (
          <View style={styles.section}>
            <Card style={styles.reflectionCard}>
              <Text style={styles.reflectionText}>
                {todayCompleted.length > 0 
                  ? `✅ Bugün ${todayCompleted.length} ${todayCompleted.length === 1 ? 'sorumluluğu' : 'sorumluluğu'} tamamladın.`
                  : '💤 Bugün dinlenme günüydü. Sorun yok.'}
              </Text>
              {missed.length > 0 && (
                <Text style={styles.reflectionText}>
                  ⚠️ {missed.length} {missed.length === 1 ? 'şey' : 'şey'} ilgilenmeyi bekliyor. Baskı yok.
                </Text>
              )}
            </Card>
          </View>
        )}

        {/* Empty State */}
        {!hasContent && (
          <EmptyState
            icon="check"
            title={t('inbox.empty')}
            subtitle="Gelen kutusu boş. Zihnin rahat."
          />
        )}
      </ScrollView>

      {/* FAB - Add New */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(tabs)/home')}
        activeOpacity={0.8}
      >
        <Icon name="add" size={24} color={colors.text.primary} />
      </TouchableOpacity>
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
    padding: spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.lg,
  },
  compactCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  criticalCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
  },
  compactTitle: {
    ...typography.body,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  compactMeta: {
    ...typography.caption,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  quickButton: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.sm,
  },
  reflectionCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  reflectionText: {
    ...typography.body,
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accentLg,
  },
});
