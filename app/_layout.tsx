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
    // Initialize stores - web-safe initialization
    const initStores = async () => {
      try {
        // Initialize error tracking (non-blocking)
        errorTrackingService.initialize().catch(() => {
          // Silently fail in production
        });

        // Initialize settings
        try {
          await useSettingsStore.getState().loadSettings();
          const settings = useSettingsStore.getState();
          setI18nLanguage(settings.language);
        } catch (error) {
          console.error('Failed to load settings:', error);
        }

        // Initialize responsibilities (non-blocking)
        useResponsibilitiesStore.getState().loadResponsibilities().catch((error) => {
          console.error('Failed to load responsibilities:', error);
        });

        // Initialize lists (non-blocking)
        useListsStore.getState().loadLists().catch((error) => {
          console.error('Failed to load lists:', error);
        });

        // Check state transitions (non-blocking)
        useResponsibilitiesStore.getState().checkStateTransitions().catch(() => {
          // Silently fail
        });
      } catch (error) {
        console.error('Failed to initialize stores:', error);
      } finally {
        // Always set ready after a short delay to allow stores to initialize
        setTimeout(() => {
          setIsReady(true);
          // Force auth store to ready if still loading
          const authStore = useAuthStore.getState();
          if (authStore.isLoading) {
            useAuthStore.setState({ isLoading: false });
          }
        }, 100);
      }
    };
    
    initStores();

    // Background services - only start after app is ready
    let interval: NodeJS.Timeout | null = null;
    let proactiveInterval: NodeJS.Timeout | null = null;
    let wellnessInterval: NodeJS.Timeout | null = null;
    let predictiveInterval: NodeJS.Timeout | null = null;

    const startBackgroundServices = () => {
      // Periodic state transition check (every 5 minutes)
      interval = setInterval(() => {
        useResponsibilitiesStore.getState().checkStateTransitions().catch(() => {});
      }, 5 * 60 * 1000);

      // Start automation service (analysis every 30 minutes)
      try {
        automationService.start(30);
      } catch (error) {
        console.error('Failed to start automation service:', error);
      }

      // Start proactive help service (check every 15 minutes)
      proactiveInterval = setInterval(() => {
        proactiveHelpService.getSuggestions().catch(() => {});
      }, 15 * 60 * 1000);

      // Wellness insights check (every hour)
      wellnessInterval = setInterval(() => {
        wellnessInsightsService.getCriticalInsight().catch(() => {});
      }, 60 * 60 * 1000);

      // Predictive actions check (every 6 hours)
      predictiveInterval = setInterval(() => {
        predictiveActionsService.getPredictiveActions(7).catch(() => {});
      }, 6 * 60 * 60 * 1000);
    };

    // Start background services after initialization
    const initTimer = setTimeout(() => {
      startBackgroundServices();
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      if (interval) clearInterval(interval);
      if (proactiveInterval) clearInterval(proactiveInterval);
      if (wellnessInterval) clearInterval(wellnessInterval);
      if (predictiveInterval) clearInterval(predictiveInterval);
      try {
        automationService.stop();
      } catch (error) {
        // Silently fail on cleanup
      }
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

