import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '@/theme';
import { Button } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { formatTime } from '@/utils/date';
import { hapticFeedback } from '@/utils/haptics';
import { getUpcomingCalendarEvents, requestCalendarPermissions } from '@/services/calendar';
import * as Calendar from 'expo-calendar';
import { addHours, startOfDay, differenceInHours, differenceInMinutes } from 'date-fns';

export default function NowModeScreen() {
  const router = useRouter();
  const { getNowMode, updateResponsibility, loadResponsibilities } = useResponsibilitiesStore();
  const { lists, loadLists } = useListsStore();
  
  const [calendarEvents, setCalendarEvents] = useState<Calendar.Event[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  
  const nowModeItems = getNowMode();
  
  useEffect(() => {
    loadResponsibilities();
    loadLists();
    loadCalendarEvents();
    
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
  };

  const getTimeUntil = (date: Date): string => {
    const now = new Date();
    const minutes = differenceInMinutes(date, now);
    if (minutes < 60) {
      return `${minutes} dk`;
    }
    const hours = differenceInHours(date, now);
    return `${hours} saat`;
  };

  const shoppingList = lists.find(l => 
    l.name.toLowerCase().includes('shopping') || 
    l.name.toLowerCase().includes('market') || 
    l.name.toLowerCase().includes('grocery') ||
    l.name.toLowerCase().includes('alışveriş')
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Şimdi Ne Yapabilirim?</Text>

        {/* Upcoming Calendar Events */}
        {calendarEvents.length > 0 && (
          <View style={styles.section}>
            {calendarEvents.slice(0, 3).map((event, index) => {
              if (!event.startDate) return null;
              const eventDate = new Date(event.startDate);
              const timeUntil = getTimeUntil(eventDate);
              
              return (
                <TouchableOpacity key={event.id || index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTime}>{formatTime(eventDate)}</Text>
                    <Text style={styles.itemTimeUntil}>{timeUntil} sonra</Text>
                  </View>
                  <Text style={styles.itemTitle}>{event.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yaklaşan (2 saat)</Text>
            {upcomingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.itemCard}
                onPress={() => router.push(`/responsibility/${task.id}`)}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTime}>
                    {task.schedule?.datetime ? formatTime(task.schedule.datetime) : ''}
                  </Text>
                  {task.schedule?.datetime && (
                    <Text style={styles.itemTimeUntil}>{getTimeUntil(task.schedule.datetime)} sonra</Text>
                  )}
                </View>
                <Text style={styles.itemTitle}>{task.title}</Text>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleComplete(task.id);
                  }}
                >
                  <Text style={styles.completeButtonText}>✓ Tamamla</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Shopping List */}
        {shoppingList && shoppingList.items.filter(i => !i.checked).length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.itemCard}
              onPress={() => router.push('/(tabs)/lists')}
            >
              <Text style={styles.itemTitle}>🛒 {shoppingList.name}</Text>
              <Text style={styles.itemSubtitle}>
                {shoppingList.items.filter(i => !i.checked).length} öğe kaldı
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Now Mode Items */}
        {nowModeItems.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şimdi Yapılabilir</Text>
            {nowModeItems.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => router.push(`/responsibility/${item.id}`)}
              >
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.itemSubtitle} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleComplete(item.id);
                  }}
                >
                  <Text style={styles.completeButtonText}>✓ Tamamla</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Şu anda yapabileceğin bir şey yok</Text>
            <Text style={styles.emptySubtext}>Dinlenmek de üretkendir ✨</Text>
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
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: spacing.md,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 12,
  },
  itemTimeUntil: {
    ...typography.caption,
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  itemTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  itemSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  completeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent.primary,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  completeButtonText: {
    ...typography.caption,
    color: colors.background.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
