/**
 * Smart Notifications Service
 * Sends notifications at the right time, in the right way
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Responsibility } from '@/types';
import { contextAwarenessService } from './contextAwareness';
import { useSettingsStore } from '@/store/settings';

interface SmartNotification {
  title: string;
  body: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  timing: 'immediate' | 'optimal';
}

class SmartNotificationsService {
  /**
   * Schedule a smart notification
   * Considers user context and preferences
   */
  async scheduleSmartNotification(notification: SmartNotification): Promise<string> {
    // Notifications are not available on web
    if (Platform.OS === 'web') {
      console.log('Notifications not available on web platform');
      return '';
    }

    // Check permissions first
    const { requestPermissions } = require('./notifications');
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted, cannot schedule notification');
      return '';
    }

    const context = await contextAwarenessService.getContext();
    const settings = useSettingsStore.getState();

    // Adjust timing based on context
    let triggerDate: Date | null = null;
    
    if (notification.timing === 'optimal') {
      // Find optimal time based on context
      triggerDate = this.findOptimalNotificationTime(context);
    }

    // Adjust priority based on context
    let priority = notification.priority;
    if (context.stressLevel === 'high' && notification.priority === 'low') {
      // Don't send low priority notifications when stressed
      return ''; // Skip notification
    }

    // Adjust based on reminder style preference
    if (settings.reminderIntensity === 'gentle' && priority === 'high') {
      priority = 'medium';
    }

    // Convert Date to seconds or null for immediate
    let trigger: { seconds: number } | null = null;
    if (triggerDate) {
      const now = new Date();
      const secondsUntil = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
      if (secondsUntil > 0) {
        trigger = { seconds: secondsUntil };
      }
      // If in the past, send immediately (null trigger)
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        sound: priority === 'high',
        priority: this.mapPriority(priority),
      },
      trigger: trigger, // null = immediate, { seconds: X } = scheduled
    });

    return notificationId;
  }

  /**
   * Find optimal time to send notification based on context
   */
  private findOptimalNotificationTime(context: any): Date {
    const now = new Date();
    
    // Don't send during deep focus time
    if (context.focusLevel === 'deep' && context.availableTime > 60) {
      // Wait until focus time ends
      return new Date(now.getTime() + 30 * 60 * 1000); // 30 min later
    }

    // Don't send during low energy times (unless critical)
    if (context.energyLevel === 'low' && context.timeOfDay === 'night') {
      // Wait until morning
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }

    // Optimal: when user has free time
    if (context.availableTime > 30) {
      return now; // Send now, user has time
    }

    // Wait until user has more time
    return new Date(now.getTime() + (30 - context.availableTime) * 60 * 1000);
  }

  /**
   * Map priority to notification priority
   */
  private mapPriority(priority: 'low' | 'medium' | 'high'): Notifications.AndroidNotificationPriority {
    switch (priority) {
      case 'high':
        return Notifications.AndroidNotificationPriority.MAX;
      case 'medium':
        return Notifications.AndroidNotificationPriority.HIGH;
      case 'low':
        return Notifications.AndroidNotificationPriority.DEFAULT;
    }
  }

  /**
   * Send contextual reminder for responsibility
   */
  async sendContextualReminder(responsibility: Responsibility): Promise<void> {
    const context = await contextAwarenessService.getContext();
    
    // Don't send if user is in deep focus
    if (context.focusLevel === 'deep') {
      return;
    }

    // Adjust message based on context
    let body = responsibility.description || 'Zamanı geldi';
    
    if (context.stressLevel === 'high') {
      body = `${body} - Baskı yok, hazır olduğunda.`;
    }

    if (context.workload === 'overloaded') {
      body = `${body} - Bugün dolu ama bu önemli.`;
    }

    await this.scheduleSmartNotification({
      title: responsibility.title,
      body,
      data: { responsibilityId: responsibility.id },
      priority: responsibility.reminderStyle === 'critical' ? 'high' : 'medium',
      timing: 'optimal',
    });
  }

  /**
   * Send proactive suggestion notification
   */
  async sendProactiveSuggestion(title: string, message: string, priority: 'low' | 'medium' | 'high' = 'low'): Promise<void> {
    const context = await contextAwarenessService.getContext();
    
    // Only send if user is not stressed
    if (context.stressLevel === 'high' && priority === 'low') {
      return;
    }

    await this.scheduleSmartNotification({
      title,
      body: message,
      priority,
      timing: 'optimal',
    });
  }
}

export const smartNotificationsService = new SmartNotificationsService();

