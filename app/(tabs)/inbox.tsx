import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, SectionHeader, Badge, Icon, EmptyState } from '@/components/ui';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime, getRelativeTime } from '@/utils/date';
import { t } from '@/i18n';

export default function InboxScreen() {
  const router = useRouter();
  const { getMissed, getSnoozed, getUpcoming, loadResponsibilities, updateResponsibility } =
    useResponsibilitiesStore();

  useEffect(() => {
    loadResponsibilities();
  }, []);

  const missed = getMissed();
  const snoozed = getSnoozed();
  const upcoming = getUpcoming();

  const handleComplete = async (id: string) => {
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('inbox.title')}</Text>
          <Text style={styles.subtitle}>
            {t('inbox.pending', { count: missed.length + upcoming.length })}
          </Text>
        </View>

        {/* Missed Critical Responsibilities */}
        {missed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title={t('inbox.missed')}
              action={<Badge label={t('inbox.highPriority')} variant="error" />}
            />
            {missed.map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => {
                  await handleComplete(item.id);
                }}
                onSwipeLeft={() => {
                  router.push(`/couldnt-do-it/${item.id}`);
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <View style={styles.itemMetaRow}>
                        <Text style={styles.itemMeta}>
                          {item.category || 'General'} • {t('inbox.dueAt', {
                            time: formatDateTime(item.schedule.datetime).split(' ')[1] || '2:00 PM'
                          })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemIcons}>
                      <Icon name="search" size={16} color={colors.text.tertiary} />
                      <Icon name="calendarIcon" size={16} color={colors.text.tertiary} />
                    </View>
                  </View>
                  <Button
                    title={t('inbox.done')}
                    onPress={() => handleComplete(item.id)}
                    size="small"
                    style={styles.actionButton}
                    variant="primary"
                  />
                </Card>
              </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Snoozed Items */}
        {snoozed.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('inbox.snoozed')} />
            {snoozed.map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => {
                  await updateResponsibility(item.id, { status: 'completed', completedAt: new Date() });
                }}
                onSwipeLeft={() => {
                  router.push(`/couldnt-do-it/${item.id}`);
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Icon name="bell" size={20} color={colors.accent.primary} />
                    <View style={styles.itemContent}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>
                        {t('inbox.pausedUntil', {
                          date: item.snoozedUntil
                            ? formatDateTime(item.snoozedUntil)
                            : formatDateTime(item.schedule.datetime)
                        })}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Upcoming Responsibilities */}
        {upcoming.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('inbox.upcoming')} />
            {upcoming.map((item) => (
              <SwipeableRow
                key={item.id}
                onSwipeRight={async () => {
                  await updateResponsibility(item.id, { status: 'completed', completedAt: new Date() });
                }}
                onSwipeLeft={() => {
                  router.push(`/couldnt-do-it/${item.id}`);
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Card style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemMeta}>
                        {item.category || 'General'} • {t('inbox.scheduled')} •{' '}
                        {formatDateTime(item.schedule.datetime).split(' ')[1] || '2:00 PM'}
                      </Text>
                    </View>
                    <Icon name="calendarIcon" size={16} color={colors.text.tertiary} />
                  </View>
                  <Button
                    title={t('inbox.complete')}
                    onPress={() => handleComplete(item.id)}
                    size="small"
                    variant="secondary"
                    style={styles.actionButton}
                  />
                </Card>
              </TouchableOpacity>
              </SwipeableRow>
            ))}
          </View>
        )}

        {/* Empty State */}
        {missed.length === 0 && snoozed.length === 0 && upcoming.length === 0 && (
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
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  highPriorityTag: {
    ...typography.caption,
    color: colors.status.error,
    backgroundColor: colors.status.error + '33',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  itemCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemLeft: {
    flex: 1,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  itemMeta: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  itemIcons: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
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
  fabText: {
    ...typography.h2,
    color: colors.text.primary,
  },
});

