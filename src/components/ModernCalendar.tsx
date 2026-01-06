/**
 * Modern, Simple Calendar Component
 * Actually works and shows responsibilities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Icon } from '@/components/ui';
import { format, startOfWeek, startOfDay, addDays, isSameDay, isToday, isTomorrow, isYesterday, getMonth, getYear, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Responsibility } from '@/types';
import { formatTime, formatDate } from '@/utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ModernCalendarProps {
  responsibilities: Responsibility[];
  onDateSelect?: (date: Date) => void;
  onResponsibilityPress?: (responsibility: Responsibility) => void;
  initialDate?: Date;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  responsibilities,
  onDateSelect,
  onResponsibilityPress,
  initialDate = new Date(),
}) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get responsibilities for a specific day
  const getResponsibilitiesForDay = (date: Date): Responsibility[] => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    
    return responsibilities
      .filter((r) => {
        if (!r.schedule?.datetime || r.status !== 'active') return false;
        try {
          const rDate = r.schedule.datetime;
          return rDate >= dayStart && rDate < dayEnd;
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });
  };

  // Get all days in current month
  const getDaysInMonth = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous/next month to fill week
    const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const weekEnd = startOfWeek(addDays(monthEnd, 1), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: addDays(weekEnd, -1) });
  };

  const days = getDaysInMonth();
  const monthName = format(currentMonth, 'MMMM yyyy');

  const handleDatePress = (date: Date) => {
    hapticFeedback.selection();
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handlePrevMonth = () => {
    hapticFeedback.light();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    hapticFeedback.light();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    hapticFeedback.medium();
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
    onDateSelect?.(today);
  };

  const selectedDayResponsibilities = selectedDate ? getResponsibilitiesForDay(selectedDate) : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
          <Icon name="chevronLeft" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>{monthName}</Text>
          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={styles.todayButtonText}>Bugün</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
          <Icon name="chevronRight" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={styles.weekdayHeader}>
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
          <View key={index} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          const dayResponsibilities = getResponsibilitiesForDay(day);
          const isCurrentMonth = getMonth(day) === getMonth(currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);

          return (
            <TouchableOpacity
              key={day.getTime()}
              style={[
                styles.dayCell,
                !isCurrentMonth && styles.dayCellOtherMonth,
                isTodayDate && styles.dayCellToday,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => handleDatePress(day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNumber,
                  !isCurrentMonth && styles.dayNumberOtherMonth,
                  isTodayDate && styles.dayNumberToday,
                  isSelected && styles.dayNumberSelected,
                ]}
              >
                {format(day, 'd')}
              </Text>
              {dayResponsibilities.length > 0 && (
                <View style={styles.dayIndicator}>
                  <View style={[
                    styles.indicatorDot,
                    dayResponsibilities.some(r => r.reminderStyle === 'critical') && styles.indicatorDotCritical,
                    dayResponsibilities.some(r => r.reminderStyle === 'persistent') && styles.indicatorDotPersistent,
                  ]} />
                  <Text style={styles.indicatorCount}>{dayResponsibilities.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Responsibilities */}
      {selectedDate && (
        <View style={styles.selectedDaySection}>
          <Text style={styles.selectedDayTitle}>
            {isToday(selectedDate) ? 'Bugün' : isTomorrow(selectedDate) ? 'Yarın' : formatDate(selectedDate)}
          </Text>
          <ScrollView style={styles.responsibilitiesList} showsVerticalScrollIndicator={false}>
            {selectedDayResponsibilities.length > 0 ? (
              selectedDayResponsibilities.map((responsibility) => (
                  <TouchableOpacity
                    key={responsibility.id}
                    style={styles.responsibilityCard}
                    onPress={() => {
                      hapticFeedback.medium();
                      onResponsibilityPress?.(responsibility);
                    }}
                    activeOpacity={0.7}
                  >
                  <View style={styles.responsibilityHeader}>
                    <View style={[
                      styles.responsibilityIndicator,
                      responsibility.reminderStyle === 'critical' && styles.responsibilityIndicatorCritical,
                      responsibility.reminderStyle === 'persistent' && styles.responsibilityIndicatorPersistent,
                    ]} />
                    <Text style={styles.responsibilityTime}>
                      {responsibility.schedule?.datetime ? formatTime(responsibility.schedule.datetime) : ''}
                    </Text>
                  </View>
                  <Text style={styles.responsibilityTitle}>{responsibility.title}</Text>
                  {responsibility.description && (
                    <Text style={styles.responsibilityDescription} numberOfLines={2}>
                      {responsibility.description}
                    </Text>
                  )}
                  {responsibility.category && (
                    <View style={styles.responsibilityCategory}>
                      <Text style={styles.responsibilityCategoryText}>{responsibility.category}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="calendarIcon" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyText}>Bu gün için görev yok</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  navButton: {
    padding: spacing.sm,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.accent.primary,
    borderRadius: 16,
  },
  todayButtonText: {
    ...typography.bodySmall,
    color: colors.background.primary,
    fontWeight: '600',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  dayCell: {
    width: SCREEN_WIDTH / 7 - spacing.sm * 2,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: spacing.xs / 2,
    backgroundColor: colors.background.secondary,
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: colors.accent.primary + '20',
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
  dayCellSelected: {
    backgroundColor: colors.accent.primary,
  },
  dayNumber: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dayNumberOtherMonth: {
    color: colors.text.tertiary,
  },
  dayNumberToday: {
    color: colors.accent.primary,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: colors.background.primary,
    fontWeight: '700',
  },
  dayIndicator: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  indicatorDotCritical: {
    backgroundColor: colors.status.error,
  },
  indicatorDotPersistent: {
    backgroundColor: colors.status.warning,
  },
  indicatorCount: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  selectedDaySection: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    padding: spacing.lg,
  },
  selectedDayTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  responsibilitiesList: {
    flex: 1,
  },
  responsibilityCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  responsibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  responsibilityIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.primary,
  },
  responsibilityIndicatorCritical: {
    backgroundColor: colors.status.error,
  },
  responsibilityIndicatorPersistent: {
    backgroundColor: colors.status.warning,
  },
  responsibilityTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
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
    marginBottom: spacing.xs,
  },
  responsibilityCategory: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    backgroundColor: colors.accent.primary + '20',
    borderRadius: 8,
  },
  responsibilityCategoryText: {
    ...typography.caption,
    color: colors.accent.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.tertiary,
    marginTop: spacing.md,
  },
});

