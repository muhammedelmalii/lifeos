import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, shadows } from '@/theme';
import { Card, Badge, Icon } from '@/components/ui';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { format, isToday, isTomorrow, addDays, startOfDay, getHours, getMinutes } from 'date-fns';
import { formatDate, formatTime } from '@/utils/date';
import { Responsibility } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_WIDTH = 320; // Her günün genişliği
const HOUR_HEIGHT = 80; // Her saatin yüksekliği

export default function PlanScreen() {
  const router = useRouter();
  const { responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const horizontalScrollRef = useRef<ScrollView>(null);
  const [currentHour, setCurrentHour] = useState(getHours(new Date()));

  useEffect(() => {
    loadResponsibilities();
    // Scroll to current hour
    const timer = setTimeout(() => {
      horizontalScrollRef.current?.scrollTo({
        x: (selectedDate.getDate() - new Date().getDate()) * DAY_WIDTH,
        animated: true,
      });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get responsibilities for a specific day
  const getResponsibilitiesForDay = (date: Date): Responsibility[] => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    
    return responsibilities
      .filter((r) => {
        const rDate = r.schedule.datetime;
        return rDate >= dayStart && rDate < dayEnd && r.status === 'active';
      })
      .sort((a, b) => a.schedule.datetime.getTime() - b.schedule.datetime.getTime());
  };

  // Generate days (7 days: 3 days ago, today, 3 days ahead)
  const generateDays = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const days = generateDays();
  const today = new Date();

  // Generate hours (24 hours)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with date selector */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelector}
        >
          {days.map((day, index) => {
            const isSelected = day.toDateString() === selectedDate.toDateString();
            const dayResponsibilities = getResponsibilitiesForDay(day);
            const isTodayDate = isToday(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                onPress={() => setSelectedDate(day)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                  {isTodayDate ? 'Bugün' : isTomorrow(day) ? 'Yarın' : formatDate(day).split(' ')[0]}
                </Text>
                <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                  {day.getDate()}
                </Text>
                {dayResponsibilities.length > 0 && (
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{dayResponsibilities.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Timeline View - Horizontal Scroll */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={DAY_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.timelineContainer}
      >
        {days.map((day, dayIndex) => {
          const dayResponsibilities = getResponsibilitiesForDay(day);
          const isTodayDate = isToday(day);
          
          return (
            <View key={dayIndex} style={styles.dayColumn}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  {isTodayDate ? 'Bugün' : isTomorrow(day) ? 'Yarın' : formatDate(day)}
                </Text>
                <Text style={styles.daySubtitle}>
                  {dayResponsibilities.length} sorumluluk
                </Text>
              </View>

              {/* Timeline with hours */}
              <ScrollView
                style={styles.timelineScroll}
                contentContainerStyle={styles.timelineContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Current time indicator for today */}
                {isTodayDate && (
                  <View
                    style={[
                      styles.currentTimeIndicator,
                      {
                        top: currentHour * HOUR_HEIGHT + (getMinutes(new Date()) / 60) * HOUR_HEIGHT,
                      },
                    ]}
                  >
                    <View style={styles.currentTimeLine} />
                    <View style={styles.currentTimeDot} />
                  </View>
                )}

                {/* Hour markers */}
                {hours.map((hour) => (
                  <View key={hour} style={styles.hourRow}>
                    <View style={styles.hourLabel}>
                      <Text style={styles.hourText}>
                        {hour.toString().padStart(2, '0')}:00
                      </Text>
                    </View>
                    <View style={styles.hourLine} />
                  </View>
                ))}

                {/* Responsibilities positioned by time */}
                {dayResponsibilities.map((responsibility) => {
                  const rHour = getHours(responsibility.schedule.datetime);
                  const rMinute = getMinutes(responsibility.schedule.datetime);
                  const topPosition = rHour * HOUR_HEIGHT + (rMinute / 60) * HOUR_HEIGHT;

                  // Calculate duration (default 1 hour)
                  const duration = 60; // minutes
                  const height = (duration / 60) * HOUR_HEIGHT;

                  return (
                    <TouchableOpacity
                      key={responsibility.id}
                      style={[
                        styles.responsibilityCard,
                        {
                          top: topPosition,
                          height: Math.max(height, 60),
                          borderLeftColor:
                            responsibility.reminderStyle === 'critical'
                              ? colors.status.error
                              : responsibility.reminderStyle === 'persistent'
                              ? colors.status.warning
                              : colors.accent.primary,
                        },
                      ]}
                      onPress={() => router.push(`/responsibility/${responsibility.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.responsibilityCardContent}>
                        <Text style={styles.responsibilityTime}>
                          {formatTime(responsibility.schedule.datetime)}
                        </Text>
                        <Text style={styles.responsibilityTitle} numberOfLines={1}>
                          {responsibility.title}
                        </Text>
                        {responsibility.description && (
                          <Text style={styles.responsibilityDescription} numberOfLines={2}>
                            {responsibility.description}
                          </Text>
                        )}
                        <View style={styles.responsibilityBadges}>
                          <Badge
                            label={responsibility.energyRequired}
                            variant={
                              responsibility.energyRequired === 'high'
                                ? 'energy_high'
                                : responsibility.energyRequired === 'medium'
                                ? 'energy_medium'
                                : 'default'
                            }
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Empty state */}
                {dayResponsibilities.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="calendarIcon" size={48} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateText}>
                      {isTodayDate ? 'Bugün boş bir gün' : 'Bu gün için sorumluluk yok'}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  dateSelector: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    alignItems: 'center',
    minWidth: 70,
    position: 'relative',
  },
  dateButtonSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  dateDay: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  dateDaySelected: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  dateNumber: {
    ...typography.h3,
    color: colors.text.primary,
    fontSize: 18,
    marginTop: spacing.xs / 2,
  },
  dateNumberSelected: {
    color: colors.text.primary,
    fontWeight: '700',
  },
  dateBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  timelineContainer: {
    paddingHorizontal: spacing.md,
  },
  dayColumn: {
    width: DAY_WIDTH,
    marginRight: spacing.md,
  },
  dayHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  dayTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  daySubtitle: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: spacing.xxl,
    minHeight: 24 * HOUR_HEIGHT,
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    position: 'relative',
  },
  hourLabel: {
    width: 60,
    paddingRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  hourText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  hourLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border.secondary,
    marginTop: HOUR_HEIGHT / 2 - 0.5,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.status.error,
    marginLeft: 60,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.error,
    marginLeft: -4,
  },
  responsibilityCard: {
    position: 'absolute',
    left: 70,
    right: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: spacing.sm,
    ...shadows.sm,
    zIndex: 5,
  },
  responsibilityCardContent: {
    flex: 1,
  },
  responsibilityTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginBottom: spacing.xs / 2,
  },
  responsibilityTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  responsibilityDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  responsibilityBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs / 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    minHeight: 400,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
