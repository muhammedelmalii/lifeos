import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Chip, Icon, EmptyState, Badge, useToast } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { formatDateTime, formatTime } from '@/utils/date';
import { hapticFeedback } from '@/utils/haptics';
import { AnimatedCard, Skeleton, SkeletonCard } from '@/components/ui';
import { analyticsService, QuickFeedback, DailyStats } from '@/services/analytics';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { gamificationService } from '@/services/gamification';
import { t } from '@/i18n';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, checkStateTransitions, updateResponsibility, responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const { lists, loadLists } = useListsStore();
  const { showToast } = useToast();
  const [quickFeedback, setQuickFeedback] = useState<QuickFeedback[]>([]);
  const [productivityScore, setProductivityScore] = useState<number>(0);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [streak, setStreak] = useState<{ current: number; longest: number; lastActiveDate: Date | null } | null>(null);
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
    hapticFeedback.success();
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
    // Refresh data after completion
    await loadResponsibilities();
    showToast('Görev tamamlandı!', 'success');
  };

  const handleStartTask = (id: string) => {
    hapticFeedback.medium();
    router.push(`/responsibility/${id}`);
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
            {nowModeItems.length > 0 
              ? `${nowModeItems.length} görev şu anda yapılabilir`
              : 'Şu anda yapabileceğin bir şey yok. Dinlenmek de üretkendir.'}
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
              onPress={() => {
                hapticFeedback.selection();
                router.push('/(tabs)/lists');
              }}
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

        {/* Quick Stats - Compact */}
        {todayStats && todayStats.total > 0 && (
          <View style={styles.quickStatsSection}>
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{todayStats.completed}</Text>
                <Text style={styles.quickStatLabel}>Tamamlandı</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={[styles.quickStatValue, { color: colors.status.error }]}>
                  {todayStats.missed}
                </Text>
                <Text style={styles.quickStatLabel}>Kaçırılan</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={[styles.quickStatValue, { color: colors.accent.primary }]}>
                  %{todayStats.completionRate}
                </Text>
                <Text style={styles.quickStatLabel}>Başarı</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Analytics & Feedback - Collapsible */}
        {todayStats && todayStats.total > 0 && (
          <View style={styles.analyticsSection}>
            {/* Productivity Score - Compact */}
            {productivityScore > 0 && (
              <AnimatedCard delay={0} variant="elevated" style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <Icon name="trendingUp" size={20} color={colors.accent.primary} />
                  <Text style={styles.scoreLabel}>Üretkenlik: {productivityScore}/100</Text>
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
              </AnimatedCard>
            )}


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

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => {
                hapticFeedback.medium();
                router.push('/(tabs)/lists');
              }}
              activeOpacity={0.7}
            >
              <Icon name="list" size={24} color={colors.accent.primary} />
              <Text style={styles.quickActionText}>Listeler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/plan')}
              activeOpacity={0.7}
            >
              <Icon name="calendarIcon" size={24} color={colors.accent.primary} />
              <Text style={styles.quickActionText}>Takvim</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={24} color={colors.accent.primary} />
              <Text style={styles.quickActionText}>Görev Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        {nowModeItems.length > 0 ? (
          <View style={styles.itemsList}>
            <Text style={styles.sectionTitle}>Şimdi Yapabileceklerin</Text>
            {nowModeItems.map((item, index) => (
              <AnimatedCard key={item.id} delay={index * 50} variant="elevated" style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                    <View style={styles.itemMeta}>
                      <Chip 
                        label={item.energyRequired === 'low' ? 'Düşük Enerji' : item.energyRequired === 'medium' ? 'Orta Enerji' : 'Yüksek Enerji'}
                        variant="default"
                        style={styles.energyChip}
                      />
                      {item.schedule?.datetime && (
                        <Text style={styles.timeHint}>
                          {formatTime(item.schedule.datetime)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.itemActions}>
                  <Button
                    title="Başla"
                    onPress={() => handleStartTask(item.id)}
                    size="medium"
                    variant="primary"
                    style={styles.startButton}
                  />
                  <Button
                    title="Tamamla"
                    onPress={() => handleComplete(item.id)}
                    size="medium"
                    variant="secondary"
                    style={styles.completeButton}
                  />
                </View>
              </AnimatedCard>
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
  quickStatsSection: {
    marginBottom: spacing.lg,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    ...shadows.sm,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    ...typography.h2,
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  quickStatLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  quickStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.primary,
    marginHorizontal: spacing.sm,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.sm,
  },
  quickActionText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  completeButton: {
    flex: 1,
  },
  timeHint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
});

