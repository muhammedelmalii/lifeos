/**
 * Analytics Service
 * Provides statistics and insights about user productivity
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { addDays, startOfDay, isAfter, isBefore, getHours, format } from 'date-fns';

export interface DailyStats {
  date: Date;
  completed: number;
  missed: number;
  total: number;
  completionRate: number;
}

export interface WeeklyReport {
  weekStart: Date;
  weekEnd: Date;
  totalCompleted: number;
  totalMissed: number;
  averageCompletionRate: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  topCategories: Array<{ category: string; count: number }>;
  energyDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  insights: string[];
}

export interface QuickFeedback {
  type: 'positive' | 'warning' | 'info';
  title: string;
  message: string;
  metric?: string;
}

class AnalyticsService {
  /**
   * Get today's statistics
   */
  getTodayStats(): DailyStats {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    
    const todayTasks = responsibilities.filter(r => {
      if (!r.schedule?.datetime) return false;
      try {
        const taskDate = r.schedule.datetime;
        return taskDate >= today && taskDate < tomorrow;
      } catch {
        return false;
      }
    });
    
    const completed = todayTasks.filter(r => r.status === 'completed').length;
    const missed = todayTasks.filter(r => r.status === 'missed').length;
    const total = todayTasks.length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      date: today,
      completed,
      missed,
      total,
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * Get weekly report
   */
  getWeeklyReport(): WeeklyReport {
    const now = new Date();
    const weekStart = startOfDay(addDays(now, -7));
    const weekEnd = startOfDay(now);
    
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    
    const weekTasks = responsibilities.filter(r => {
      if (!r.schedule?.datetime) return false;
      try {
        const taskDate = r.schedule.datetime;
        return taskDate >= weekStart && taskDate < weekEnd;
      } catch {
        return false;
      }
    });
    
    const completed = weekTasks.filter(r => r.status === 'completed' && r.completedAt);
    const missed = weekTasks.filter(r => r.status === 'missed');
    
    const totalCompleted = completed.length;
    const totalMissed = missed.length;
    const total = totalCompleted + totalMissed;
    const averageCompletionRate = total > 0 ? (totalCompleted / total) * 100 : 0;
    
    // Most productive day
    const dayCounts: Record<string, number> = {};
    completed.forEach(r => {
      if (r.completedAt) {
        const dayName = format(r.completedAt, 'EEEE');
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      }
    });
    const mostProductiveDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
    
    // Most productive hour
    const hourCounts: Record<number, number> = {};
    completed.forEach(r => {
      if (r.completedAt) {
        const hour = getHours(r.completedAt);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const mostProductiveHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 10;
    
    // Top categories
    const categoryCounts: Record<string, number> = {};
    completed.forEach(r => {
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
    
    // Energy distribution
    const energyDistribution = {
      low: weekTasks.filter(r => r.energyRequired === 'low').length,
      medium: weekTasks.filter(r => r.energyRequired === 'medium').length,
      high: weekTasks.filter(r => r.energyRequired === 'high').length,
    };
    
    // Generate insights
    const insights: string[] = [];
    if (averageCompletionRate >= 80) {
      insights.push(`Harika! Son haftada %${Math.round(averageCompletionRate)} başarı oranı.`);
    } else if (averageCompletionRate < 50) {
      insights.push(`Tamamlama oranın %${Math.round(averageCompletionRate)}. Hedeflerini küçültmeyi düşün.`);
    }
    
    if (mostProductiveDay !== 'N/A') {
      insights.push(`En verimli günün: ${mostProductiveDay}`);
    }
    
    if (topCategories.length > 0) {
      insights.push(`En çok ${topCategories[0].category} kategorisinde çalıştın.`);
    }
    
    return {
      weekStart,
      weekEnd,
      totalCompleted,
      totalMissed,
      averageCompletionRate: Math.round(averageCompletionRate),
      mostProductiveDay,
      mostProductiveHour,
      topCategories,
      energyDistribution,
      insights,
    };
  }

  /**
   * Get quick feedback for Now page
   */
  getQuickFeedback(): QuickFeedback[] {
    const feedbacks: QuickFeedback[] = [];
    const todayStats = this.getTodayStats();
    const weeklyReport = this.getWeeklyReport();
    
    // Today's completion rate
    if (todayStats.completionRate >= 80 && todayStats.completed > 0) {
      feedbacks.push({
        type: 'positive',
        title: 'Harika Gün!',
        message: `Bugün ${todayStats.completed} görev tamamladın. %${todayStats.completionRate} başarı!`,
        metric: `${todayStats.completionRate}%`,
      });
    } else if (todayStats.completionRate < 50 && todayStats.total > 0) {
      feedbacks.push({
        type: 'warning',
        title: 'Yavaş Başlangıç',
        message: `Bugün ${todayStats.completed}/${todayStats.total} görev tamamlandı. Sorun yok, devam et!`,
        metric: `${todayStats.completionRate}%`,
      });
    }
    
    // Weekly trend
    if (weeklyReport.averageCompletionRate >= 75) {
      feedbacks.push({
        type: 'positive',
        title: 'Haftalık Trend',
        message: `Bu hafta ${weeklyReport.totalCompleted} görev tamamladın. İyi gidiyor!`,
        metric: `${weeklyReport.averageCompletionRate}%`,
      });
    }
    
    // Energy balance
    const totalEnergy = weeklyReport.energyDistribution.low + 
                       weeklyReport.energyDistribution.medium + 
                       weeklyReport.energyDistribution.high;
    if (totalEnergy > 0) {
      const lowPercent = (weeklyReport.energyDistribution.low / totalEnergy) * 100;
      if (lowPercent < 20) {
        feedbacks.push({
          type: 'info',
          title: 'Enerji Dengesi',
          message: 'Düşük enerji görevleri ekleyerek dengeyi sağla.',
          metric: `${Math.round(lowPercent)}% düşük enerji`,
        });
      }
    }
    
    // Most productive time
    if (weeklyReport.mostProductiveHour) {
      feedbacks.push({
        type: 'info',
        title: 'En Verimli Saat',
        message: `En çok ${weeklyReport.mostProductiveHour}:00 civarında üretkensin.`,
        metric: `${weeklyReport.mostProductiveHour}:00`,
      });
    }
    
    return feedbacks.slice(0, 3); // Max 3 feedback
  }

  /**
   * Get productivity score (0-100)
   */
  getProductivityScore(): number {
    const todayStats = this.getTodayStats();
    const weeklyReport = this.getWeeklyReport();
    
    // Weighted score: 60% today, 40% weekly
    const todayScore = todayStats.completionRate;
    const weeklyScore = weeklyReport.averageCompletionRate;
    
    return Math.round((todayScore * 0.6) + (weeklyScore * 0.4));
  }
}

export const analyticsService = new AnalyticsService();

