import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Chip, Icon, EmptyState, Badge } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { formatDateTime } from '@/utils/date';
import { analyticsService, QuickFeedback } from '@/services/analytics';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { gamificationService } from '@/services/gamification';
import { t } from '@/i18n';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, checkStateTransitions, updateResponsibility, responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const { lists, loadLists } = useListsStore();
  const [quickFeedback, setQuickFeedback] = useState<QuickFeedback[]>([]);
  const [productivityScore, setProductivityScore] = useState<number>(0);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [encouragement, setEncouragement] = useState<string>('');
  
  // Get shopping list
  const shoppingList = lists.find(l => 
    l.name.toLowerCase().includes('shopping') || 
    l.name.toLowerCase().includes('market') || 
    l.name.toLowerCase().includes('grocery') ||
    l.name.toLowerCase().includes('alışveriş')
  );
  
  useEffect(() => {
    checkStateTransitions();
    loadResponsibilities();
    loadLists();
  }, []);

  useEffect(() => {
    // Load analytics
    const feedback = analyticsService.getQuickFeedback();
    const score = analyticsService.getProductivityScore();
    const stats = analyticsService.getTodayStats();
    
    setQuickFeedback(feedback);
    setProductivityScore(score);
    setTodayStats(stats);

    // Load gamification
    const loadGamification = async () => {
      const streakData = await gamificationService.getStreak();
      const achievementsData = await gamificationService.getAchievements();
      const encouragementMsg = gamificationService.getEncouragementMessage(streakData, stats);
      
      setStreak(streakData);
      setAchievements(achievementsData);
      setEncouragement(encouragementMsg);
    };
    
    loadGamification();
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
          
          {/* Streak & Encouragement */}
          {streak && streak.current > 0 && (
            <Card style={styles.streakCard as any}>
              <View style={styles.streakRow}>
                <Icon name="flame" size={24} color={colors.status.warning} />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakLabel}>Günlük Seri</Text>
                  <Text style={styles.streakValue}>{streak.current} gün</Text>
                </View>
                {encouragement && (
                  <Text style={styles.encouragement}>{encouragement}</Text>
                )}
              </View>
            </Card>
          )}
        </View>

        {/* Shopping List Quick Access */}
        {shoppingList && shoppingList.items.length > 0 && (
          <Card style={styles.shoppingCard}>
            <TouchableOpacity 
              onPress={() => router.push('/lists')}
              activeOpacity={0.7}
            >
              <View style={styles.shoppingHeader}>
                <View style={styles.shoppingTitleRow}>
                  <Icon name="shoppingCart" size={24} color={colors.accent.primary} />
                  <Text style={styles.shoppingTitle}>{shoppingList.name}</Text>
                  <Badge 
                    label={`${shoppingList.items.filter(i => !i.checked).length} öğe`}
                    variant="accent"
                  />
                </View>
                <Icon name="chevronRight" size={20} color={colors.text.tertiary} />
              </View>
              <View style={styles.shoppingItems}>
                {shoppingList.items.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.shoppingItem}>
                    <Icon 
                      name={item.checked ? "checkCircle" : "circle"} 
                      size={16} 
                      color={item.checked ? colors.status.success : colors.text.tertiary} 
                    />
                    <Text 
                      style={[
                        styles.shoppingItemText,
                        item.checked && styles.shoppingItemTextChecked
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
                {shoppingList.items.length > 3 && (
                  <Text style={styles.shoppingMore}>
                    +{shoppingList.items.length - 3} daha...
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </Card>
        )}

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
                      feedback.type === 'positive' ? styles.feedbackCardPositive : null,
                      feedback.type === 'warning' ? styles.feedbackCardWarning : null,
                    ].filter(Boolean) as any}
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
  shoppingCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  shoppingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shoppingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  shoppingTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  shoppingItems: {
    gap: spacing.xs,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  shoppingItemText: {
    ...typography.body,
    color: colors.text.primary,
  },
  shoppingItemTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  shoppingMore: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
  },
  streakCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  streakValue: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
  },
  encouragement: {
    ...typography.bodySmall,
    color: colors.accent.primary,
    fontWeight: '600',
  },
  achievementsCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  achievementsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementItem: {
    width: '48%',
    padding: spacing.sm,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.status.success,
  },
  achievementTitle: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontSize: 11,
  },
  achievementTitleUnlocked: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  achievementProgress: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border.secondary,
    borderRadius: 2,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  achievementProgressBar: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  achievementProgressText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs / 2,
    fontSize: 10,
  },
});

