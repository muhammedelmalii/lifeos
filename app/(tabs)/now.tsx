import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Chip, Icon, EmptyState, Badge } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { formatDateTime } from '@/utils/date';
import { analyticsService, QuickFeedback } from '@/services/analytics';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { t } from '@/i18n';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, checkStateTransitions, updateResponsibility, responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const [quickFeedback, setQuickFeedback] = useState<QuickFeedback[]>([]);
  const [productivityScore, setProductivityScore] = useState<number>(0);
  const [todayStats, setTodayStats] = useState<any>(null);
  
  useEffect(() => {
    checkStateTransitions();
    loadResponsibilities();
  }, []);

  useEffect(() => {
    // Load analytics
    const feedback = analyticsService.getQuickFeedback();
    const score = analyticsService.getProductivityScore();
    const stats = analyticsService.getTodayStats();
    
    setQuickFeedback(feedback);
    setProductivityScore(score);
    setTodayStats(stats);
  }, [responsibilities]);

  const nowModeItems = getNowMode();

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
          <Text style={styles.title}>Şimdi Ne Yapabilirim?</Text>
          <Text style={styles.subtitle}>
            Bunalmış mısın? Sadece şu anda yapabileceğin küçük şeyler.
          </Text>
        </View>

        {/* Analytics & Feedback */}
        {todayStats && (
          <View style={styles.analyticsSection}>
            {/* Productivity Score */}
            <Card style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Icon name="trendingUp" size={24} color={colors.accent.primary} />
                <Text style={styles.scoreLabel}>Üretkenlik Skoru</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{productivityScore}</Text>
                <Text style={styles.scoreUnit}>/100</Text>
              </View>
              <View style={styles.scoreBar}>
                <View 
                  style={[
                    styles.scoreBarFill, 
                    { 
                      width: `${productivityScore}%`,
                      backgroundColor: productivityScore >= 70 ? colors.status.success : 
                                      productivityScore >= 50 ? colors.status.warning : 
                                      colors.status.error,
                    }
                  ]} 
                />
              </View>
            </Card>

            {/* Today's Stats */}
            <Card style={styles.statsCard}>
              <Text style={styles.statsTitle}>Bugün</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayStats.completed}</Text>
                  <Text style={styles.statLabel}>Tamamlandı</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.status.error }]}>
                    {todayStats.missed}
                  </Text>
                  <Text style={styles.statLabel}>Kaçırılan</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayStats.total}</Text>
                  <Text style={styles.statLabel}>Toplam</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.accent.primary }]}>
                    %{todayStats.completionRate}
                  </Text>
                  <Text style={styles.statLabel}>Başarı</Text>
                </View>
              </View>
            </Card>

            {/* Quick Feedback */}
            {quickFeedback.length > 0 && (
              <View style={styles.feedbackSection}>
                {quickFeedback.map((feedback, index) => (
                  <Card 
                    key={index} 
                    style={[
                      styles.feedbackCard,
                      feedback.type === 'positive' && styles.feedbackCardPositive,
                      feedback.type === 'warning' && styles.feedbackCardWarning,
                    ]}
                  >
                    <View style={styles.feedbackHeader}>
                      <Icon 
                        name={feedback.type === 'positive' ? 'checkCircle' : feedback.type === 'warning' ? 'alertCircle' : 'info'} 
                        size={20} 
                        color={
                          feedback.type === 'positive' ? colors.status.success :
                          feedback.type === 'warning' ? colors.status.warning :
                          colors.accent.primary
                        } 
                      />
                      <Text style={styles.feedbackTitle}>{feedback.title}</Text>
                      {feedback.metric && (
                        <Badge 
                          label={feedback.metric} 
                          variant="default"
                          style={styles.feedbackBadge}
                        />
                      )}
                    </View>
                    <Text style={styles.feedbackMessage}>{feedback.message}</Text>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Items */}
        {nowModeItems.length > 0 ? (
          <View style={styles.itemsList}>
            {nowModeItems.map((item) => (
              <Card key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                    <View style={styles.itemMeta}>
                      <Chip 
                        label={item.energyRequired === 'low' ? 'Low Energy' : item.energyRequired}
                        variant="default"
                        style={styles.energyChip}
                      />
                      {item.checklist.length > 0 && (
                        <Text style={styles.checklistHint}>
                          {item.checklist.length} quick steps
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <Button
                  title="Başla"
                  onPress={() => router.push(`/responsibility/${item.id}`)}
                  size="medium"
                  variant="primary"
                  style={styles.startButton}
                />
              </Card>
            ))}
          </View>
        ) : (
          <EmptyState
            icon="check"
            title="Şu anda düşük enerji gerektiren bir şey yok."
            subtitle="Mola ver. Dinlenmek de üretkendir."
          />
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
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
    ...shadows.sm,
  },
  itemHeader: {
    marginBottom: spacing.md,
  },
  itemContent: {
    gap: spacing.xs,
  },
  itemTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  itemDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  energyChip: {
    alignSelf: 'flex-start',
  },
  checklistHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  startButton: {
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
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
  analyticsSection: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  scoreCard: {
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    ...shadows.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scoreLabel: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  scoreValue: {
    ...typography.h1,
    fontSize: 48,
    color: colors.text.primary,
    fontWeight: '700',
  },
  scoreUnit: {
    ...typography.body,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
    fontSize: 18,
  },
  scoreBar: {
    height: 8,
    backgroundColor: colors.border.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
  },
  statValue: {
    ...typography.h2,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  feedbackSection: {
    gap: spacing.sm,
  },
  feedbackCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  feedbackCardPositive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.success,
  },
  feedbackCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  feedbackTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  feedbackBadge: {
    marginLeft: 'auto',
  },
  feedbackMessage: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
});

