import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Button, Icon, useToast } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { formatTime, formatDateTime, getRelativeTime } from '@/utils/date';
import { hapticFeedback } from '@/utils/haptics';
import { AnimatedCard } from '@/components/ui';
import { getUpcomingCalendarEvents, requestCalendarPermissions } from '@/services/calendar';
import * as Calendar from 'expo-calendar';
import { addHours, isAfter, isBefore, startOfDay, differenceInHours, differenceInMinutes } from 'date-fns';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, updateResponsibility, loadResponsibilities } = useResponsibilitiesStore();
  const { lists, loadLists } = useListsStore();
  const { showToast } = useToast();
  
  const [calendarEvents, setCalendarEvents] = useState<Calendar.Event[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  
  const nowModeItems = getNowMode();
  
  useEffect(() => {
    loadResponsibilities();
    loadLists();
    loadCalendarEvents();
    
    // Refresh every minute
    const interval = setInterval(() => {
      loadResponsibilities();
      loadCalendarEvents();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCalendarEvents = async () => {
    try {
      const hasPermission = await requestCalendarPermissions();
      if (hasPermission) {
        const events = await getUpcomingCalendarEvents();
        // Filter events for today and tomorrow
        const now = new Date();
        const tomorrow = addHours(startOfDay(now), 48);
        const relevantEvents = events.filter(e => {
          if (!e.startDate) return false;
          const eventDate = new Date(e.startDate);
          return eventDate >= now && eventDate <= tomorrow;
        });
        setCalendarEvents(relevantEvents);
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  // Get tasks that are coming up soon (next 2 hours)
  useEffect(() => {
    const now = new Date();
    const twoHoursLater = addHours(now, 2);
    
    const upcoming = nowModeItems
      .filter(item => {
        if (!item.schedule?.datetime) return false;
        const taskTime = item.schedule.datetime;
        return taskTime >= now && taskTime <= twoHoursLater;
      })
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      })
      .slice(0, 5);
    
    setUpcomingTasks(upcoming);
  }, [nowModeItems]);

  const handleComplete = async (id: string) => {
    hapticFeedback.success();
    await updateResponsibility(id, { status: 'completed', completedAt: new Date() });
    await loadResponsibilities();
    showToast('Tamamlandı!', 'success');
  };

  const handleStartTask = (id: string) => {
    hapticFeedback.medium();
    router.push(`/responsibility/${id}`);
  };

  // Get shopping list
  const shoppingList = lists.find(l => 
    l.name.toLowerCase().includes('shopping') || 
    l.name.toLowerCase().includes('market') || 
    l.name.toLowerCase().includes('grocery') ||
    l.name.toLowerCase().includes('alışveriş')
  );

  const getTimeUntil = (date: Date): string => {
    const now = new Date();
    const minutes = differenceInMinutes(date, now);
    if (minutes < 60) {
      return `${minutes} dakika`;
    }
    const hours = differenceInHours(date, now);
    return `${hours} saat`;
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
              : 'Şu anda yapabileceğin bir şey yok'}
          </Text>
        </View>

        {/* Upcoming Calendar Events - Proactive */}
        {calendarEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşan Randevular</Text>
            {calendarEvents.slice(0, 3).map((event, index) => {
              if (!event.startDate) return null;
              const eventDate = new Date(event.startDate);
              const timeUntil = getTimeUntil(eventDate);
              
              return (
                <AnimatedCard key={event.id || index} delay={index * 50} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Icon name="calendarIcon" size={20} color={colors.accent.primary} />
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Text style={styles.eventTime}>
                        {formatTime(eventDate)} • {timeUntil} sonra
                      </Text>
                    </View>
                  </View>
                  {event.notes && (
                    <Text style={styles.eventNotes} numberOfLines={2}>
                      {event.notes}
                    </Text>
                  )}
                </AnimatedCard>
              );
            })}
          </View>
        )}

        {/* Upcoming Tasks - Next 2 Hours */}
        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşan Görevler (2 saat içinde)</Text>
            {upcomingTasks.map((task, index) => (
              <AnimatedCard key={task.id} delay={index * 50} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.schedule?.datetime && (
                      <Text style={styles.taskTime}>
                        {formatTime(task.schedule.datetime)} • {getTimeUntil(task.schedule.datetime)} sonra
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <Button
                    title="Başla"
                    onPress={() => handleStartTask(task.id)}
                    size="small"
                    variant="primary"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Tamamla"
                    onPress={() => handleComplete(task.id)}
                    size="small"
                    variant="secondary"
                    style={styles.actionButton}
                  />
                </View>
              </AnimatedCard>
            ))}
          </View>
        )}

        {/* Shopping List Quick Access */}
        {shoppingList && shoppingList.items.filter(i => !i.checked).length > 0 && (
          <View style={styles.section}>
            <Card style={styles.shoppingCard}>
              <TouchableOpacity 
                onPress={() => {
                  hapticFeedback.selection();
                  router.push('/(tabs)/lists');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.shoppingHeader}>
                  <Icon name="shoppingCart" size={24} color={colors.accent.primary} />
                  <View style={styles.shoppingInfo}>
                    <Text style={styles.shoppingTitle}>{shoppingList.name}</Text>
                    <Text style={styles.shoppingCount}>
                      {shoppingList.items.filter(i => !i.checked).length} öğe kaldı
                    </Text>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Now Mode Items - Low Energy Tasks */}
        {nowModeItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şimdi Yapabileceklerin</Text>
            {nowModeItems.slice(0, 5).map((item, index) => (
              <AnimatedCard key={item.id} delay={index * 50} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    {item.schedule?.datetime && (
                      <Text style={styles.taskTime}>
                        {formatTime(item.schedule.datetime)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <Button
                    title="Başla"
                    onPress={() => handleStartTask(item.id)}
                    size="small"
                    variant="primary"
                    style={styles.actionButton}
                  />
                  <Button
                    title="Tamamla"
                    onPress={() => handleComplete(item.id)}
                    size="small"
                    variant="secondary"
                    style={styles.actionButton}
                  />
                </View>
              </AnimatedCard>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="checkCircle" size={64} color={colors.text.tertiary} />
            <Text style={styles.emptyTitle}>Şu anda yapabileceğin bir şey yok</Text>
            <Text style={styles.emptySubtitle}>
              Dinlenmek de üretkendir. Yaklaşan görevlerin için takvime bak.
            </Text>
            <Button
              title="Takvime Git"
              onPress={() => {
                hapticFeedback.medium();
                router.push('/(tabs)/plan');
              }}
              variant="secondary"
              style={styles.emptyButton}
            />
          </View>
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
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    fontSize: 16,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
    fontSize: 18,
  },
  eventCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  eventTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  eventNotes: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  taskCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  taskHeader: {
    marginBottom: spacing.sm,
  },
  taskInfo: {
    gap: spacing.xs / 2,
  },
  taskTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  taskDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 13,
  },
  taskTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
    marginTop: spacing.xs / 2,
  },
  taskActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  shoppingCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    ...shadows.sm,
  },
  shoppingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  shoppingInfo: {
    flex: 1,
  },
  shoppingTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  shoppingCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptyButton: {
    minWidth: 150,
  },
});
