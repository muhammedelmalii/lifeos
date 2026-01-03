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
const DAY_WIDTH = SCREEN_WIDTH - spacing.lg * 2; // Full width minus padding
const HOUR_HEIGHT = 60; // Compact hour height
const HOURS_VISIBLE = 16; // Show 6 AM to 10 PM by default

export default function PlanScreen() {
  const router = useRouter();
  const { responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const [selectedDateIndex, setSelectedDateIndex] = useState(3); // Today is index 3 (center)
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadResponsibilities();
    // Scroll to today
    setTimeout(() => {
      horizontalScrollRef.current?.scrollTo({
        x: selectedDateIndex * (DAY_WIDTH + spacing.md),
        animated: false,
      });
      // Scroll to current hour
      const hour = getHours(currentTime);
      const scrollY = Math.max(0, (hour - 6) * HOUR_HEIGHT - 100);
      verticalScrollRef.current?.scrollTo({
        y: scrollY,
        animated: false,
      });
    }, 100);

    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
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

  // Generate hours (6 AM to 10 PM)
  const hours = Array.from({ length: HOURS_VISIBLE }, (_, i) => i + 6);

  const handleDaySelect = (index: number) => {
    setSelectedDateIndex(index);
    horizontalScrollRef.current?.scrollTo({
      x: index * (DAY_WIDTH + spacing.md),
      animated: true,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Compact Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan</Text>
        {/* Horizontal Date Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelector}
        >
          {days.map((day, index) => {
            const isSelected = index === selectedDateIndex;
            const dayResponsibilities = getResponsibilitiesForDay(day);
            const isTodayDate = isToday(day);
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                onPress={() => handleDaySelect(index)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                  {isTodayDate ? 'Bugün' : isTomorrow(day) ? 'Yarın' : format(day, 'EEE')}
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

      {/* Horizontal Timeline Scroll */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={DAY_WIDTH + spacing.md}
        snapToAlignment="start"
        contentContainerStyle={styles.timelineContainer}
        onMomentumScrollEnd={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / (DAY_WIDTH + spacing.md));
          setSelectedDateIndex(Math.max(0, Math.min(days.length - 1, index)));
        }}
      >
        {days.map((day, dayIndex) => {
          const dayResponsibilities = getResponsibilitiesForDay(day);
          const isTodayDate = isToday(day);
          
          return (
            <View key={dayIndex} style={styles.dayColumn}>
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayTitle}>
                    {isTodayDate ? 'Bugün' : isTomorrow(day) ? 'Yarın' : formatDate(day)}
                  </Text>
                  <Text style={styles.daySubtitle}>
                    {format(day, 'd MMMM yyyy')}
                  </Text>
                </View>
                {dayResponsibilities.length > 0 && (
                  <View style={styles.dayCount}>
                    <Text style={styles.dayCountText}>{dayResponsibilities.length}</Text>
                  </View>
                )}
              </View>

              {/* Timeline with hours */}
              <ScrollView
                ref={dayIndex === selectedDateIndex ? verticalScrollRef : null}
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
                        top: getHours(currentTime) * HOUR_HEIGHT + (getMinutes(currentTime) / 60) * HOUR_HEIGHT - (6 * HOUR_HEIGHT),
                      },
                    ]}
                  >
                    <View style={styles.currentTimeDot} />
                    <View style={styles.currentTimeLine} />
                  </View>
                )}

                {/* Hour markers */}
                {hours.map((hour) => (
                  <View key={hour} style={styles.hourRow}>
                    <Text style={styles.hourText}>
                      {hour.toString().padStart(2, '0')}:00
                    </Text>
                    <View style={styles.hourLine} />
                  </View>
                ))}

                {/* Responsibilities positioned by time */}
                {dayResponsibilities.map((responsibility) => {
                  const rHour = getHours(responsibility.schedule.datetime);
                  const rMinute = getMinutes(responsibility.schedule.datetime);
                  
                  // Only show if in visible hours range
                  if (rHour < 6 || rHour > 21) return null;
                  
                  const topPosition = (rHour - 6) * HOUR_HEIGHT + (rMinute / 60) * HOUR_HEIGHT;
                  const duration = 60; // Default 1 hour
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 50);

                  const isCritical = responsibility.reminderStyle === 'critical';
                  const isPersistent = responsibility.reminderStyle === 'persistent';

                  return (
                    <TouchableOpacity
                      key={responsibility.id}
                      style={[
                        styles.responsibilityCard,
                        {
                          top: topPosition,
                          height: height,
                          borderLeftColor: isCritical
                            ? colors.status.error
                            : isPersistent
                            ? colors.status.warning
                            : colors.accent.primary,
                          backgroundColor: isCritical 
                            ? colors.status.error + '15'
                            : colors.background.secondary,
                        },
                      ]}
                      onPress={() => router.push(`/responsibility/${responsibility.id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.responsibilityCardContent}>
                        <View style={styles.responsibilityHeader}>
                          <Text style={styles.responsibilityTime}>
                            {formatTime(responsibility.schedule.datetime)}
                          </Text>
                          {isCritical && (
                            <View style={styles.criticalBadge}>
                              <Text style={styles.criticalBadgeText}>!</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.responsibilityTitle} numberOfLines={2}>
                          {responsibility.title}
                        </Text>
                        {responsibility.category && (
                          <Text style={styles.responsibilityCategory} numberOfLines={1}>
                            {responsibility.category}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Empty state */}
                {dayResponsibilities.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="calendarIcon" size={56} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateTitle}>
                      {isTodayDate ? 'Bugün boş' : 'Boş gün'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                      {isTodayDate ? 'Henüz planlanmış bir şey yok' : 'Bu gün için sorumluluk yok'}
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
    fontSize: 32,
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
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 75,
    height: 70,
    position: 'relative',
  },
  dateButtonSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
    ...shadows.md,
  },
  dateDay: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  dateDaySelected: {
    color: colors.text.primary,
  },
  dateNumber: {
    ...typography.h2,
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  dateNumberSelected: {
    color: colors.text.primary,
  },
  dateBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.status.error,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs / 2,
    ...shadows.sm,
  },
  dateBadgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  timelineContainer: {
    paddingHorizontal: spacing.lg,
  },
  dayColumn: {
    width: DAY_WIDTH,
    marginRight: spacing.md,
    flex: 1,
  },
  dayHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs / 2,
  },
  daySubtitle: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontSize: 13,
  },
  dayCount: {
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCountText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingBottom: spacing.xxl * 2,
    minHeight: HOURS_VISIBLE * HOUR_HEIGHT,
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    alignItems: 'center',
    paddingLeft: spacing.md,
    position: 'relative',
  },
  hourText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: '500',
    width: 50,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.secondary,
    marginLeft: spacing.md,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
  },
  currentTimeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.status.error,
    ...shadows.sm,
  },
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.status.error,
    marginLeft: spacing.md,
    opacity: 0.8,
  },
  responsibilityCard: {
    position: 'absolute',
    left: spacing.md + 50 + spacing.md,
    right: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: spacing.md,
    ...shadows.md,
    zIndex: 5,
  },
  responsibilityCardContent: {
    flex: 1,
  },
  responsibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  responsibilityTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  criticalBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticalBadgeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  responsibilityTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: spacing.xs / 2,
    lineHeight: 18,
  },
  responsibilityCategory: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    marginTop: spacing.xs / 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    minHeight: 400,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontSize: 13,
  },
});
