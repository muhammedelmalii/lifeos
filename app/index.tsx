import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for auth store to load with timeout
    const timer = setTimeout(() => {
      setIsReady(true);
      // If auth store is still loading after timeout, force it to ready
      if (useAuthStore.getState().isLoading) {
        useAuthStore.setState({ isLoading: false });
      }
    }, 2000); // Increased timeout for web
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!isReady || isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Check onboarding status (simplified for MVP)
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

