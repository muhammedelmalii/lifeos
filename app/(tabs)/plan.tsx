import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { ModernCalendar } from '@/components/ModernCalendar';
import { Responsibility } from '@/types';
import { getUpcomingCalendarEvents, requestCalendarPermissions } from '@/services/calendar';
import * as Calendar from 'expo-calendar';

export default function PlanScreen() {
  const router = useRouter();
  const { responsibilities, loadResponsibilities } = useResponsibilitiesStore();
  const [calendarEvents, setCalendarEvents] = useState<Calendar.Event[]>([]);

  useEffect(() => {
    loadResponsibilities();
    loadCalendarEvents();
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      loadResponsibilities();
      loadCalendarEvents();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCalendarEvents = async () => {
    try {
      const hasPermission = await requestCalendarPermissions();
      if (hasPermission) {
        // Load events for current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const events = await getCalendarEvents(monthStart, monthEnd);
        setCalendarEvents(events);
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
  };

  const handleDateSelect = (date: Date) => {
    // Tarih seçildiğinde yapılacak işlemler
    console.log('Selected date:', date);
  };

  const handleResponsibilityPress = (responsibility: Responsibility) => {
    router.push(`/responsibility/${responsibility.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ModernCalendar
        responsibilities={responsibilities}
        onDateSelect={handleDateSelect}
        onResponsibilityPress={handleResponsibilityPress}
        initialDate={new Date()}
        calendarEvents={calendarEvents}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
