import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, SectionHeader } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime } from '@/utils/date';
import { t } from '@/i18n';

type BriefingType = 'morning' | 'evening';

export default function BriefingScreen() {
  const { getUpcoming, getMissed, checkStateTransitions, responsibilities } = useResponsibilitiesStore();
  const [briefingType, setBriefingType] = useState<BriefingType>('morning');

  useEffect(() => {
    checkStateTransitions();
    // Determine briefing type based on time of day
    const hour = new Date().getHours();
    setBriefingType(hour < 12 ? 'morning' : 'evening');
  }, []);

  const upcoming = getUpcoming();
  const missed = getMissed();
  const completed = responsibilities.filter((r) => r.status === 'completed' && r.completedAt);
  const todayCompleted = completed.filter((r) => {
    if (!r.completedAt) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedDate = new Date(r.completedAt);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime();
  });
  const critical = upcoming.filter((r) => r.reminderStyle === 'critical');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {briefingType === 'morning' ? 'Sabah Özeti' : 'Akşam Özeti'}
          </Text>
          <Text style={styles.subtitle}>
            {briefingType === 'morning' 
              ? 'Bugün ne var?'
              : 'Neler oldu bugün?'}
          </Text>
        </View>

        {briefingType === 'morning' ? (
          <>
            {/* Today */}
            <View style={styles.section}>
              <SectionHeader title="Bugün" />
              {upcoming.length > 0 ? (
                <View style={styles.itemsList}>
                  {upcoming.slice(0, 5).map((item) => (
                    <Card key={item.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>
                        {formatDateTime(item.schedule.datetime)}
                      </Text>
                    </Card>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No responsibilities scheduled today.</Text>
              )}
            </View>

            {/* Critical */}
            {critical.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Kritik" />
                <View style={styles.itemsList}>
                  {critical.slice(0, 3).map((item) => (
                    <Card key={item.id} style={styles.itemCard}>
                      <View style={styles.criticalIndicator} />
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>
                        {formatDateTime(item.schedule.datetime)}
                      </Text>
                    </Card>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Completed */}
            {todayCompleted.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Tamamlanan" />
                <View style={styles.itemsList}>
                  {todayCompleted.map((item) => (
                    <Card key={item.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {item.completedAt && (
                        <Text style={styles.itemTime}>
                          {formatDateTime(item.completedAt).split(' ')[1]}'de tamamlandı
                        </Text>
                      )}
                    </Card>
                  ))}
                </View>
              </View>
            )}

            {/* Missed */}
            {missed.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Kaçırılan" />
                <View style={styles.itemsList}>
                  {missed.slice(0, 3).map((item) => (
                    <Card key={item.id} style={styles.itemCard}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemTime}>
                        {formatDateTime(item.schedule.datetime)} tarihindeydi
                      </Text>
                    </Card>
                  ))}
                </View>
                <Text style={styles.gentleNote}>
                  Sorun yok. Hayat böyle. Hazır olduğunda birlikte ayarlayalım.
                </Text>
              </View>
            )}

            {/* Reflection */}
            <View style={styles.section}>
              <Card style={styles.reflectionCard}>
                <Text style={styles.reflectionText}>
                  {todayCompleted.length > 0 
                    ? `Bugün ${todayCompleted.length} ${todayCompleted.length === 1 ? 'sorumluluğu' : 'sorumluluğu'} tamamladın.`
                    : 'Bugün dinlenme günüydü. Sorun yok.'}
                </Text>
                {missed.length > 0 && (
                  <Text style={styles.reflectionText}>
                    {missed.length} {missed.length === 1 ? 'şey' : 'şey'} ilgilenmeyi bekliyor. Baskı yok.
                  </Text>
                )}
              </Card>
            </View>
          </>
        )}
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
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  itemsList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
    position: 'relative',
    ...shadows.sm,
  },
  criticalIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: colors.accent.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemTime: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  gentleNote: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
  reflectionCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.md,
  },
  reflectionText: {
    ...typography.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
});

