import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { colors, spacing, typography, shadows } from '@/theme';
import { Icon } from '@/components/ui';
import { format, isToday, isTomorrow, isYesterday, addDays, startOfDay, getHours, getMinutes, getMonth, getDate } from 'date-fns';
import { Responsibility } from '@/types';
import { formatTime } from '@/utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mevsim renkleri
const SEASON_COLORS = {
  spring: {
    primary: '#4ade80', // Yeşil
    secondary: '#86efac',
    background: '#dcfce7',
    accent: '#22c55e',
  },
  summer: {
    primary: '#fbbf24', // Sarı/Turuncu
    secondary: '#fcd34d',
    background: '#fef3c7',
    accent: '#f59e0b',
  },
  autumn: {
    primary: '#f97316', // Turuncu/Kırmızı
    secondary: '#fb923c',
    background: '#fed7aa',
    accent: '#ea580c',
  },
  winter: {
    primary: '#60a5fa', // Mavi
    secondary: '#93c5fd',
    background: '#dbeafe',
    accent: '#3b82f6',
  },
};

// Mevsim belirleme
const getSeason = (date: Date): keyof typeof SEASON_COLORS => {
  const month = getMonth(date);
  if (month >= 2 && month <= 4) return 'spring'; // Mart-Mayıs
  if (month >= 5 && month <= 7) return 'summer'; // Haziran-Ağustos
  if (month >= 8 && month <= 10) return 'autumn'; // Eylül-Kasım
  return 'winter'; // Aralık-Şubat
};

interface TimelineCalendarProps {
  responsibilities: Responsibility[];
  onDateSelect?: (date: Date) => void;
  onResponsibilityPress?: (responsibility: Responsibility) => void;
  initialDate?: Date;
}

export const TimelineCalendar: React.FC<TimelineCalendarProps> = ({
  responsibilities,
  onDateSelect,
  onResponsibilityPress,
  initialDate = new Date(),
}) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = gün, 2 = hafta, 3 = ay
  const [centerDate, setCenterDate] = useState(initialDate);
  const [visibleDays, setVisibleDays] = useState<Date[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Zoom seviyelerine göre gün sayısı
  const getDaysPerView = () => {
    switch (zoomLevel) {
      case 1: return 7; // Gün görünümü: 7 gün
      case 2: return 14; // Hafta görünümü: 14 gün
      case 3: return 30; // Ay görünümü: 30 gün
      default: return 7;
    }
  };

  // Gün genişliği zoom seviyesine göre
  const getDayWidth = () => {
    const daysPerView = getDaysPerView();
    return (SCREEN_WIDTH - spacing.lg * 2) / daysPerView;
  };

  // Görünür günleri hesapla (daha fazla gün yükle sonsuz scroll için)
  useEffect(() => {
    const days: Date[] = [];
    const daysPerView = getDaysPerView();
    const buffer = daysPerView * 2; // Her iki yönde buffer ekle
    const startOffset = Math.floor(buffer / 2);
    
    for (let i = -startOffset; i <= startOffset; i++) {
      days.push(addDays(centerDate, i));
    }
    
    setVisibleDays(days);
  }, [centerDate, zoomLevel]);

  // Zaman güncellemesi
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Pinch-to-zoom handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Pinch gesture detection (basit versiyon)
        if (evt.nativeEvent.touches.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) +
            Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          // Zoom logic burada olabilir, şimdilik basit tutuyoruz
        }
      },
    })
  ).current;

  // Günlük sorumlulukları getir
  const getResponsibilitiesForDay = useCallback((date: Date): Responsibility[] => {
    const dayStart = startOfDay(date);
    const dayEnd = addDays(dayStart, 1);
    
    return responsibilities
      .filter((r) => {
        const rDate = r.schedule.datetime;
        return rDate >= dayStart && rDate < dayEnd && r.status === 'active';
      })
      .sort((a, b) => a.schedule.datetime.getTime() - b.schedule.datetime.getTime());
  }, [responsibilities]);

  // Zoom değiştir
  const handleZoomChange = (level: 1 | 2 | 3) => {
    setZoomLevel(level);
  };

  // Tarih seç
  const handleDateSelect = (date: Date) => {
    setCenterDate(date);
    onDateSelect?.(date);
  };

  // Scroll handler - sonsuz scroll için
  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const dayWidth = getDayWidth();
    const daysPerView = getDaysPerView();
    const buffer = daysPerView * 2;
    const centerIndex = Math.floor(offsetX / dayWidth) + Math.floor(buffer / 2);
    
    if (centerIndex >= 0 && centerIndex < visibleDays.length) {
      const newCenterDate = visibleDays[centerIndex];
      if (newCenterDate && newCenterDate.getTime() !== centerDate.getTime()) {
        // Eğer merkez tarih değiştiyse, yeni günler yükle
        const threshold = Math.floor(buffer / 4);
        if (Math.abs(centerIndex - Math.floor(buffer / 2)) > threshold) {
          setCenterDate(newCenterDate);
        }
      }
    }
  };

  // Bugüne git
  const goToToday = () => {
    const today = new Date();
    setCenterDate(today);
    onDateSelect?.(today);
    // Scroll to today after state update
    setTimeout(() => {
      const daysPerView = getDaysPerView();
      const buffer = daysPerView * 2;
      const startOffset = Math.floor(buffer / 2);
      const todayIndex = visibleDays.findIndex(d => isToday(d));
      if (todayIndex >= 0 && scrollViewRef.current) {
        const dayWidth = getDayWidth();
        scrollViewRef.current.scrollTo({
          x: (todayIndex - startOffset) * dayWidth,
          animated: true,
        });
      }
    }, 100);
  };

  const dayWidth = getDayWidth();
  const daysPerView = getDaysPerView();
  const currentSeason = getSeason(centerDate);
  const seasonColors = SEASON_COLORS[currentSeason];

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: seasonColors.background + '40' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
            <Icon name="calendarIcon" size={18} color={seasonColors.primary} />
            <Text style={[styles.todayButtonText, { color: seasonColors.primary }]}>Today</Text>
          </TouchableOpacity>
          
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={[styles.zoomButton, zoomLevel === 1 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange(1)}
            >
              <Text style={[styles.zoomButtonText, zoomLevel === 1 && styles.zoomButtonTextActive]}>Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomButton, zoomLevel === 2 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange(2)}
            >
              <Text style={[styles.zoomButtonText, zoomLevel === 2 && styles.zoomButtonTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomButton, zoomLevel === 3 && styles.zoomButtonActive]}
              onPress={() => handleZoomChange(3)}
            >
              <Text style={[styles.zoomButtonText, zoomLevel === 3 && styles.zoomButtonTextActive]}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dateInfo}>
          <Text style={[styles.monthText, { color: seasonColors.primary }]}>
            {format(centerDate, 'MMMM yyyy')}
          </Text>
          <Text style={styles.seasonText}>{currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}</Text>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={dayWidth}
        snapToAlignment="start"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.timelineContainer}
      >
        {visibleDays.map((day, index) => {
          const dayResponsibilities = getResponsibilitiesForDay(day);
          const isTodayDate = isToday(day);
          const isTomorrowDate = isTomorrow(day);
          const isYesterdayDate = isYesterday(day);
          const daySeason = getSeason(day);
          const dayColors = SEASON_COLORS[daySeason];

          return (
            <TouchableOpacity
              key={day.getTime()}
              style={[
                styles.dayColumn,
                {
                  width: dayWidth,
                  backgroundColor: isTodayDate ? dayColors.background + '60' : 'transparent',
                  borderLeftColor: dayColors.primary,
                },
              ]}
              onPress={() => handleDateSelect(day)}
              activeOpacity={0.7}
            >
              {/* Day Header */}
              <View style={styles.dayHeader}>
                <View>
                  <Text style={[styles.dayName, { color: dayColors.primary }]}>
                    {isTodayDate ? 'Today' : isTomorrowDate ? 'Tomorrow' : isYesterdayDate ? 'Yesterday' : format(day, 'EEE')}
                  </Text>
                  <Text style={[styles.dayNumber, { color: dayColors.accent }]}>
                    {getDate(day)}
                  </Text>
                </View>
                {dayResponsibilities.length > 0 && (
                  <View style={[styles.dayBadge, { backgroundColor: dayColors.primary }]}>
                    <Text style={styles.dayBadgeText}>{dayResponsibilities.length}</Text>
                  </View>
                )}
              </View>

              {/* Responsibilities */}
              <View style={styles.responsibilitiesContainer}>
                {dayResponsibilities.map((responsibility) => {
                  const rHour = getHours(responsibility.schedule.datetime);
                  const rMinute = getMinutes(responsibility.schedule.datetime);
                  const topPosition = ((rHour * 60 + rMinute) / (24 * 60)) * 200; // 200px yükseklik
                  const isCritical = responsibility.reminderStyle === 'critical';
                  const isPersistent = responsibility.reminderStyle === 'persistent';

                  return (
                    <TouchableOpacity
                      key={responsibility.id}
                      style={[
                        styles.responsibilityItem,
                        {
                          top: topPosition,
                          borderLeftColor: isCritical
                            ? colors.status.error
                            : isPersistent
                            ? colors.status.warning
                            : dayColors.primary,
                          backgroundColor: isCritical
                            ? colors.status.error + '20'
                            : dayColors.background + '80',
                        },
                      ]}
                      onPress={() => onResponsibilityPress?.(responsibility)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.responsibilityTime}>
                        {formatTime(responsibility.schedule.datetime)}
                      </Text>
                      <Text style={styles.responsibilityTitle} numberOfLines={2}>
                        {responsibility.title}
                      </Text>
                      {responsibility.category && (
                        <Text style={[styles.responsibilityCategory, { color: dayColors.primary }]} numberOfLines={1}>
                          {responsibility.category}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Current time indicator (sadece bugün için) */}
                {isTodayDate && (
                  <View
                    style={[
                      styles.currentTimeIndicator,
                      {
                        top: ((getHours(currentTime) * 60 + getMinutes(currentTime)) / (24 * 60)) * 200,
                        backgroundColor: dayColors.primary,
                      },
                    ]}
                  >
                    <View style={[styles.currentTimeDot, { backgroundColor: dayColors.accent }]} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
  },
  todayButtonText: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 13,
  },
  zoomControls: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    padding: spacing.xs / 2,
  },
  zoomButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  zoomButtonActive: {
    backgroundColor: colors.accent.primary,
  },
  zoomButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  zoomButtonTextActive: {
    color: colors.text.primary,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthText: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: '700',
  },
  seasonText: {
    ...typography.body,
    color: colors.text.tertiary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  timelineContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dayColumn: {
    borderLeftWidth: 2,
    paddingHorizontal: spacing.xs,
    marginRight: spacing.sm,
    minHeight: 250,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.secondary,
  },
  dayName: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs / 2,
  },
  dayNumber: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: '700',
  },
  dayBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  dayBadgeText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  responsibilitiesContainer: {
    position: 'relative',
    minHeight: 200,
  },
  responsibilityItem: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: spacing.xs,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  responsibilityTime: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  responsibilityTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  responsibilityCategory: {
    ...typography.caption,
    fontSize: 10,
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
  },
});

