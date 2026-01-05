/**
 * Gamified Notifications Service
 * Duolingo-style motivational notifications
 */

import { Responsibility } from '@/types';
import { gamificationService } from './gamification';
import { analyticsService } from './analytics';
import { smartNotificationsService } from './smartNotifications';
import { Platform } from 'react-native';
import { format, isToday, addDays, startOfDay, getHours } from 'date-fns';

export interface GamifiedNotification {
  title: string;
  body: string;
  emoji: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

class GamifiedNotificationsService {
  /**
   * Send streak reminder (Duolingo style)
   */
  async sendStreakReminder(): Promise<void> {
    if (Platform.OS === 'web') return;

    const streak = await gamificationService.getStreak();
    const now = new Date();
    const hour = getHours(now);

    // Don't send if already active today
    if (streak.lastActiveDate && isToday(streak.lastActiveDate)) {
      return;
    }

    // Send at optimal times (morning 8-10, evening 18-20)
    if ((hour >= 8 && hour <= 10) || (hour >= 18 && hour <= 20)) {
      let title = '';
      let body = '';
      let emoji = '🔥';

      if (streak.current === 0) {
        title = 'Seri Başlat!';
        body = 'Bugün bir görev tamamlayarak seri başlat!';
        emoji = '🚀';
      } else if (streak.current < 7) {
        title = `🔥 ${streak.current} Günlük Seri!`;
        body = 'Serini bozma! Bugün bir görev tamamla.';
        emoji = '🔥';
      } else if (streak.current < 30) {
        title = `🔥 ${streak.current} Günlük Seri!`;
        body = 'Harika gidiyorsun! Serini koru!';
        emoji = '🔥';
      } else {
        title = `🔥 ${streak.current} Günlük Seri!`;
        body = 'İnanılmaz! Sen bir efsanesin!';
        emoji = '👑';
      }

      await smartNotificationsService.scheduleSmartNotification({
        title: `${emoji} ${title}`,
        body,
        data: { type: 'streak_reminder', streak: streak.current },
        priority: 'medium',
        timing: 'immediate',
      });
    }
  }

  /**
   * Send achievement unlocked notification
   */
  async sendAchievementUnlocked(achievementId: string, achievementTitle: string): Promise<void> {
    if (Platform.OS === 'web') return;

    await smartNotificationsService.scheduleSmartNotification({
      title: '🏆 Başarım Açıldı!',
      body: `"${achievementTitle}" başarımını kazandın!`,
      data: { type: 'achievement', achievementId },
      priority: 'high',
      timing: 'immediate',
    });
  }

  /**
   * Send daily motivation
   */
  async sendDailyMotivation(): Promise<void> {
    if (Platform.OS === 'web') return;

    const todayStats = analyticsService.getTodayStats();
    const streak = await gamificationService.getStreak();
    const hour = getHours(new Date());

    // Send in the morning (8-9 AM)
    if (hour >= 8 && hour <= 9) {
      let title = '';
      let body = '';
      let emoji = '☀️';

      if (streak.current >= 7) {
        title = `🔥 ${streak.current} Günlük Seri!`;
        body = 'Harika bir gün geçirmek için hazır mısın?';
        emoji = '🔥';
      } else if (todayStats.completed > 0) {
        title = '💪 Devam Et!';
        body = `Dün ${todayStats.completed} görev tamamladın. Bugün daha iyisini yapabilirsin!`;
        emoji = '💪';
      } else {
        title = '🚀 Yeni Bir Gün!';
        body = 'Bugün görevlerini tamamlayarak harika bir gün geçir!';
        emoji = '🚀';
      }

      await smartNotificationsService.scheduleSmartNotification({
        title: `${emoji} ${title}`,
        body,
        data: { type: 'daily_motivation' },
        priority: 'low',
        timing: 'immediate',
      });
    }
  }

  /**
   * Send completion celebration
   */
  async sendCompletionCelebration(completedCount: number, totalCount: number): Promise<void> {
    if (Platform.OS === 'web') return;

    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    let title = '';
    let body = '';
    let emoji = '✨';

    if (completionRate === 100) {
      title = '🎉 Mükemmel Gün!';
      body = 'Tüm görevlerini tamamladın! Sen harikasın!';
      emoji = '🎉';
    } else if (completionRate >= 80) {
      title = '✨ Harika İş!';
      body = `${completedCount} görev tamamladın! Devam et!`;
      emoji = '✨';
    } else if (completedCount > 0) {
      title = '💪 İyi Gidiyorsun!';
      body = `${completedCount} görev tamamladın. Devam et!`;
      emoji = '💪';
    }

    if (title) {
      await smartNotificationsService.scheduleSmartNotification({
        title: `${emoji} ${title}`,
        body,
        data: { type: 'completion_celebration', completed: completedCount, total: totalCount },
        priority: 'low',
        timing: 'immediate',
      });
    }
  }

  /**
   * Send gentle reminder for missed tasks
   */
  async sendGentleReminder(responsibility: Responsibility): Promise<void> {
    if (Platform.OS === 'web') return;

    const streak = await gamificationService.getStreak();
    
    let title = '';
    let body = '';
    let emoji = '⏰';

    if (streak.current >= 7) {
      title = '🔥 Serini Koru!';
      body = `"${responsibility.title}" görevini tamamlayarak serini koru!`;
      emoji = '🔥';
    } else {
      title = '💡 Hatırlatma';
      body = `"${responsibility.title}" görevini tamamlamayı unutma!`;
      emoji = '💡';
    }

    await smartNotificationsService.scheduleSmartNotification({
      title: `${emoji} ${title}`,
      body,
      data: { type: 'gentle_reminder', responsibilityId: responsibility.id },
      priority: 'medium',
      timing: 'immediate',
    });
  }

  /**
   * Schedule daily notifications
   */
  scheduleDailyNotifications() {
    // This would be called from app initialization
    // Schedule morning motivation
    // Schedule evening reminder if streak is at risk
  }
}

export const gamifiedNotificationsService = new GamifiedNotificationsService();

