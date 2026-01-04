import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/theme';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { TimelineCalendar } from '@/components/TimelineCalendar';

export default function PlanScreen() {
  const router = useRouter();
  const { responsibilities, loadResponsibilities } = useResponsibilitiesStore();

  useEffect(() => {
    loadResponsibilities();
  }, []);

  const handleDateSelect = (date: Date) => {
    // Tarih seçildiğinde yapılacak işlemler
    console.log('Selected date:', date);
  };

  const handleResponsibilityPress = (responsibility: Responsibility) => {
    router.push(`/responsibility/${responsibility.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TimelineCalendar
        responsibilities={responsibilities}
        onDateSelect={handleDateSelect}
        onResponsibilityPress={handleResponsibilityPress}
        initialDate={new Date()}
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
