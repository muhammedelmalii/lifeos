/**
 * Gamification Service
 * Duolingo-style motivation system with streaks, achievements, and rewards
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { analyticsService } from './analytics';
import { startOfDay, differenceInDays, isToday, addDays } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveDate: Date | null;
}

export interface DailyReward {
  day: number;
  reward: string;
  claimed: boolean;
  claimedAt?: Date;
}

class GamificationService {
  private readonly STREAK_KEY = '@lifeos:streak';
  private readonly ACHIEVEMENTS_KEY = '@lifeos:achievements';
  private readonly DAILY_REWARDS_KEY = '@lifeos:daily_rewards';

  /**
   * Get current streak
   */
  async getStreak(): Promise<Streak> {
    try {
      const stored = await AsyncStorage.getItem(this.STREAK_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          lastActiveDate: data.lastActiveDate ? new Date(data.lastActiveDate) : null,
        };
      }
    } catch (error) {
      console.error('Failed to load streak:', error);
    }

    return {
      current: 0,
      longest: 0,
      lastActiveDate: null,
    };
  }

  /**
   * Update streak when task is completed
   */
  async updateStreak(): Promise<Streak> {
    const streak = await this.getStreak();
    const today = startOfDay(new Date());
    const lastActive = streak.lastActiveDate ? startOfDay(new Date(streak.lastActiveDate)) : null;

    // Check if already active today
    if (lastActive && isToday(lastActive)) {
      return streak;
    }

    // Check if consecutive day
    if (lastActive) {
      const daysDiff = differenceInDays(today, lastActive);
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        streak.current += 1;
        streak.longest = Math.max(streak.longest, streak.current);
      } else if (daysDiff > 1) {
        // Streak broken - reset
        streak.current = 1;
      }
    } else {
      // First time - start streak
      streak.current = 1;
      streak.longest = Math.max(streak.longest, streak.current);
    }

    streak.lastActiveDate = today;

    // Save
    await AsyncStorage.setItem(this.STREAK_KEY, JSON.stringify(streak));

    return streak;
  }

  /**
   * Get achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const completed = responsibilities.filter(r => r.status === 'completed');
    const todayStats = analyticsService.getTodayStats();
    const streak = await this.getStreak();

    try {
      const stored = await AsyncStorage.getItem(this.ACHIEVEMENTS_KEY);
      const unlocked: Record<string, Date> = stored ? JSON.parse(stored) : {};
      
      const achievements: Achievement[] = [
        {
          id: 'first_task',
          title: 'İlk Adım',
          description: 'İlk görevi tamamla',
          icon: 'star',
          unlockedAt: unlocked.first_task ? new Date(unlocked.first_task) : undefined,
          progress: completed.length > 0 ? 1 : 0,
          target: 1,
        },
        {
          id: 'perfect_day',
          title: 'Mükemmel Gün',
          description: 'Bir günde tüm görevleri tamamla',
          icon: 'checkCircle',
          unlockedAt: unlocked.perfect_day ? new Date(unlocked.perfect_day) : undefined,
          progress: todayStats.completionRate === 100 && todayStats.total > 0 ? 1 : 0,
          target: 1,
        },
        {
          id: 'streak_7',
          title: '7 Günlük Seri',
          description: '7 gün üst üste görev tamamla',
          icon: 'flame',
          unlockedAt: unlocked.streak_7 ? new Date(unlocked.streak_7) : undefined,
          progress: Math.min(streak.current, 7),
          target: 7,
        },
        {
          id: 'streak_30',
          title: '30 Günlük Seri',
          description: '30 gün üst üste görev tamamla',
          icon: 'flame',
          unlockedAt: unlocked.streak_30 ? new Date(unlocked.streak_30) : undefined,
          progress: Math.min(streak.current, 30),
          target: 30,
        },
        {
          id: 'task_master',
          title: 'Görev Ustası',
          description: '100 görev tamamla',
          icon: 'award',
          unlockedAt: unlocked.task_master ? new Date(unlocked.task_master) : undefined,
          progress: completed.length,
          target: 100,
        },
        {
          id: 'early_bird',
          title: 'Erken Kuş',
          description: 'Sabah 8\'den önce görev tamamla',
          icon: 'sun',
          unlockedAt: unlocked.early_bird ? new Date(unlocked.early_bird) : undefined,
          progress: completed.some(r => {
            if (!r.completedAt) return false;
            const hour = r.completedAt.getHours();
            return hour < 8;
          }) ? 1 : 0,
          target: 1,
        },
        {
          id: 'night_owl',
          title: 'Gece Kuşu',
          description: 'Gece 22\'den sonra görev tamamla',
          icon: 'moon',
          unlockedAt: unlocked.night_owl ? new Date(unlocked.night_owl) : undefined,
          progress: completed.some(r => {
            if (!r.completedAt) return false;
            const hour = r.completedAt.getHours();
            return hour >= 22;
          }) ? 1 : 0,
          target: 1,
        },
      ];

      // Check for new achievements
      for (const achievement of achievements) {
        if (!achievement.unlockedAt && achievement.progress >= achievement.target) {
          achievement.unlockedAt = new Date();
          unlocked[achievement.id] = achievement.unlockedAt.toISOString();
          await AsyncStorage.setItem(this.ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
        }
      }

      return achievements;
    } catch (error) {
      console.error('Failed to load achievements:', error);
      return [];
    }
  }

  /**
   * Get motivational message based on streak and progress
   */
  getMotivationalMessage(): string {
    // This will be called with current context
    return '';
  }

  /**
   * Get daily reward status
   */
  async getDailyReward(): Promise<DailyReward | null> {
    try {
      const stored = await AsyncStorage.getItem(this.DAILY_REWARDS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          claimedAt: data.claimedAt ? new Date(data.claimedAt) : undefined,
        };
      }
    } catch (error) {
      console.error('Failed to load daily reward:', error);
    }

    return null;
  }

  /**
   * Claim daily reward
   */
  async claimDailyReward(): Promise<DailyReward> {
    const streak = await this.getStreak();
    const today = startOfDay(new Date());
    const lastClaim = await this.getDailyReward();

    // Check if already claimed today
    if (lastClaim?.claimedAt && isToday(new Date(lastClaim.claimedAt))) {
      return lastClaim;
    }

    const reward: DailyReward = {
      day: lastClaim ? (isToday(addDays(new Date(lastClaim.claimedAt || today), 1)) ? lastClaim.day + 1 : 1) : 1,
      reward: this.getRewardForDay(streak.current + 1),
      claimed: true,
      claimedAt: today,
    };

    await AsyncStorage.setItem(this.DAILY_REWARDS_KEY, JSON.stringify(reward));
    return reward;
  }

  private getRewardForDay(day: number): string {
    if (day % 7 === 0) return '🎁 Haftalık Bonus!';
    if (day % 3 === 0) return '⭐ 3 Günlük Bonus!';
    return '✨ Günlük Ödül!';
  }

  /**
   * Get encouragement message
   */
  getEncouragementMessage(streak: Streak, todayStats: any): string {
    if (streak.current >= 30) {
      return '🔥 30 günlük seri! İnanılmaz!';
    }
    if (streak.current >= 7) {
      return `🔥 ${streak.current} günlük seri! Harika gidiyorsun!`;
    }
    if (todayStats.completionRate === 100) {
      return '🎉 Mükemmel gün! Tüm görevler tamamlandı!';
    }
    if (todayStats.completionRate >= 80) {
      return '✨ Harika iş çıkardın! Devam et!';
    }
    if (todayStats.completed > 0) {
      return '💪 İyi gidiyorsun! Devam et!';
    }
    return '🚀 Başlamak için hiçbir zaman geç değil!';
  }
}

export const gamificationService = new GamificationService();

