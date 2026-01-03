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
const DAY_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const HOUR_HEIGHT = 70;
const HOURS_VISIBLE = 16;

export default function PlanScreen() {
  const router = useRouter();
  const { responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const [selectedDateIndex, setSelectedDateIndex] = useState(3);
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadResponsibilities();
    setTimeout(() => {
      horizontalScrollRef.current?.scrollTo({
        x: selectedDateIndex * (DAY_WIDTH + spacing.md),
        animated: false,
      });
      const hour = getHours(currentTime);
      const scrollY = Math.max(0, (hour - 6) * HOUR_HEIGHT - 150);
      verticalScrollRef.current?.scrollTo({
        y: scrollY,
        animated: false,
      });
    }, 100);

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  const generateDays = (): Date[] => {
    const days: Date[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const days = generateDays();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plan</Text>
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
                  {isTodayDate ? 'Today' : isTomorrow(day) ? 'Tomorrow' : format(day, 'EEE')}
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
              <View style={styles.dayHeader}>
                <View>
                  <Text style={styles.dayTitle}>
                    {isTodayDate ? 'Today' : isTomorrow(day) ? 'Tomorrow' : formatDate(day)}
                  </Text>
                  <Text style={styles.daySubtitle}>
                    {format(day, 'MMMM d, yyyy')}
                  </Text>
                </View>
                {dayResponsibilities.length > 0 && (
                  <View style={styles.dayCount}>
                    <Text style={styles.dayCountText}>{dayResponsibilities.length}</Text>
                  </View>
                )}
              </View>

              <ScrollView
                ref={dayIndex === selectedDateIndex ? verticalScrollRef : null}
                style={styles.timelineScroll}
                contentContainerStyle={styles.timelineContent}
                showsVerticalScrollIndicator={false}
              >
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

                {hours.map((hour) => (
                  <View key={hour} style={styles.hourRow}>
                    <Text style={styles.hourText}>
                      {hour.toString().padStart(2, '0')}:00
                    </Text>
                    <View style={styles.hourLine} />
                  </View>
                ))}

                {dayResponsibilities.map((responsibility) => {
                  const rHour = getHours(responsibility.schedule.datetime);
                  const rMinute = getMinutes(responsibility.schedule.datetime);
                  
                  if (rHour < 6 || rHour > 21) return null;
                  
                  const topPosition = (rHour - 6) * HOUR_HEIGHT + (rMinute / 60) * HOUR_HEIGHT;
                  const duration = 60;
                  const height = Math.max((duration / 60) * HOUR_HEIGHT, 60);

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
                              <Icon name="alertCircle" size={10} color={colors.text.primary} />
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

                {dayResponsibilities.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="calendarIcon" size={40} color={colors.text.tertiary} />
                    <Text style={styles.emptyStateTitle}>
                      {isTodayDate ? 'No tasks today' : 'No tasks'}
                    </Text>
                    <Text style={styles.emptyStateText}>
                      {isTodayDate ? 'Enjoy your free time' : 'No responsibilities scheduled'}
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
    borderRadius: 14,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    height: 68,
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
    fontSize: 10,
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
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs / 2,
    ...shadows.sm,
  },
  dateBadgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 10,
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
    fontSize: 18,
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
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCountText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 13,
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
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: spacing.md,
    ...shadows.md,
    zIndex: 5,
    minHeight: 60,
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
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.status.error,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: spacing.xxl,
    minHeight: 300,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 16,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontSize: 13,
  },
});
