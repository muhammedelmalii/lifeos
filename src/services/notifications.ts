import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Responsibility, ReminderStyle, EscalationRule } from '@/types';

// Only set notification handler on native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const requestPermissions = async (): Promise<boolean> => {
  // Notifications are not available on web
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A9EFF',
    });

    await Notifications.setNotificationChannelAsync('critical', {
      name: 'Critical',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 500, 500],
      lightColor: '#f87171',
      sound: 'default',
    });
  }

  return true;
};

export const scheduleResponsibilityNotifications = async (
  responsibility: Responsibility
): Promise<string[]> => {
  // Notifications are not available on web
  if (Platform.OS === 'web') {
    console.log('Notifications not available on web platform');
    return [];
  }

  const notificationIds: string[] = [];
  const { schedule, reminderStyle, escalationRules, title } = responsibility;

  // Schedule main notification
  const mainId = await Notifications.scheduleNotificationAsync({
    content: {
      title: title,
      body: responsibility.description || 'Time for this responsibility',
      data: {
        responsibilityId: responsibility.id,
        type: 'responsibility',
        reminderStyle,
      },
      sound: true,
      priority: reminderStyle === 'critical' ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: schedule.datetime,
  });
  notificationIds.push(mainId);

  // Schedule escalation notifications
  for (const rule of escalationRules) {
    const triggerDate = new Date(schedule.datetime.getTime() - rule.offsetMinutes * 60000);
    if (triggerDate > new Date()) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: `Starting in ${rule.offsetMinutes} minutes`,
          data: {
            responsibilityId: responsibility.id,
            type: 'escalation',
            reminderStyle: rule.strength,
          },
          sound: true,
          priority:
            rule.strength === 'critical'
              ? Notifications.AndroidNotificationPriority.MAX
              : Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: triggerDate,
      });
      notificationIds.push(id);
    }
  }

  return notificationIds;
};

export const cancelNotification = async (notificationId: string): Promise<void> => {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

export const cancelAllNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  if (Platform.OS === 'web') return [];
  return await Notifications.getAllScheduledNotificationsAsync();
};

