import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { useSettingsStore } from '@/store/settings';
import { setLanguage as setI18nLanguage } from '@/i18n';
import { colors } from '@/theme';
import { automationService } from '@/services/automation';
import { proactiveHelpService } from '@/services/proactiveHelp';
import { wellnessInsightsService } from '@/services/wellnessInsights';
import { predictiveActionsService } from '@/services/predictiveActions';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { errorTrackingService } from '@/services/errorTracking';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const { isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize error tracking
    errorTrackingService.initialize().catch(console.error);

    // Initialize stores with timeout to prevent infinite loading
    const initStores = async () => {
      try {
        // Set timeout to ensure we don't wait forever
        const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
        
        const initPromise = (async () => {
          try {
            await useSettingsStore.getState().loadSettings();
            const settings = useSettingsStore.getState();
            setI18nLanguage(settings.language);
            
            await useResponsibilitiesStore.getState().loadResponsibilities();
            await useListsStore.getState().loadLists();
            
            // Check state transitions on startup
            await useResponsibilitiesStore.getState().checkStateTransitions();
          } catch (error) {
            console.error('Failed to initialize stores:', error);
          }
        })();
        
        await Promise.race([initPromise, timeout]);
      } catch (error) {
        console.error('Failed to initialize stores:', error);
      } finally {
        setIsReady(true);
        // Also ensure auth store is ready
        const authStore = useAuthStore.getState();
        if (authStore.isLoading) {
          useAuthStore.setState({ isLoading: false });
        }
      }
    };
    
    initStores();

    // Periodic state transition check (every 5 minutes)
    const interval = setInterval(() => {
      useResponsibilitiesStore.getState().checkStateTransitions();
    }, 5 * 60 * 1000);

    // Start automation service (analysis every 30 minutes)
    automationService.start(30);

    // Start proactive help service (check every 15 minutes)
    const proactiveInterval = setInterval(() => {
      proactiveHelpService.getSuggestions().catch(console.error);
    }, 15 * 60 * 1000);

    // Wellness insights check (every hour)
    const wellnessInterval = setInterval(() => {
      wellnessInsightsService.getCriticalInsight().catch(console.error);
    }, 60 * 60 * 1000);

    // Predictive actions check (every 6 hours)
    const predictiveInterval = setInterval(() => {
      predictiveActionsService.getPredictiveActions(7).catch(console.error);
    }, 6 * 60 * 60 * 1000);

    // Initial checks
    proactiveHelpService.getSuggestions().catch(console.error);
    wellnessInsightsService.getCriticalInsight().catch(console.error);
    predictiveActionsService.getPredictiveActions(7).catch(console.error);

    return () => {
      clearInterval(interval);
      clearInterval(proactiveInterval);
      clearInterval(wellnessInterval);
      clearInterval(predictiveInterval);
      automationService.stop();
    };
  }, []);

  if (!isReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="responsibility/[id]" />
              <Stack.Screen name="couldnt-do-it/[id]" />
            </Stack>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

