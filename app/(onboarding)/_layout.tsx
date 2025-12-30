import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="reminder-style" />
      <Stack.Screen name="widget" />
    </Stack>
  );
}

