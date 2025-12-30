/**
 * Wellness Insights Service
 * Monitors user's work-life balance and provides health insights
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { addDays, startOfDay, isAfter, isBefore, getHours } from 'date-fns';

export interface WellnessInsight {
  type: 'balance' | 'stress' | 'rest' | 'productivity' | 'energy';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion?: string;
  metric?: string;
}

class WellnessInsightsService {
  /**
   * Analyze user's wellness and provide insights
   */
  async analyzeWellness(): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = addDays(today, -7);

    // 1. Work-Life Balance Analysis
    insights.push(...await this.analyzeWorkLifeBalance(responsibilities, today));

    // 2. Stress Level Analysis
    insights.push(...await this.analyzeStressLevel(responsibilities, today));

    // 3. Rest & Recovery Analysis
    insights.push(...await this.analyzeRest(responsibilities, today));

    // 4. Productivity Patterns
    insights.push(...await this.analyzeProductivity(responsibilities, weekAgo));

    // 5. Energy Management
    insights.push(...await this.analyzeEnergyManagement(responsibilities, today));

    return insights.filter(i => i !== null) as WellnessInsight[];
  }

  /**
   * Analyze work-life balance
   */
  private async analyzeWorkLifeBalance(
    responsibilities: Responsibility[],
    today: Date
  ): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const tomorrow = addDays(today, 1);

    const todayTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      isAfter(r.schedule.datetime, today) &&
      isBefore(r.schedule.datetime, tomorrow)
    );

    const workTasks = todayTasks.filter(r =>
      r.category?.toLowerCase().includes('work') ||
      r.category?.toLowerCase().includes('business') ||
      r.category?.toLowerCase().includes('meeting')
    );

    const personalTasks = todayTasks.filter(r => !workTasks.includes(r));

    const workPercent = todayTasks.length > 0
      ? (workTasks.length / todayTasks.length) * 100
      : 0;

    if (workPercent > 80) {
      insights.push({
        type: 'balance',
        title: 'İş-Yaşam Dengesi',
        message: `Bugün görevlerinin %${Math.round(workPercent)}'i iş ile ilgili. Kişisel zaman eklemek ister misin?`,
        severity: 'warning',
        suggestion: 'Akşam için kişisel bir aktivite ekleyebilirsin.',
        metric: `${Math.round(workPercent)}% iş`,
      });
    } else if (workPercent < 20 && todayTasks.length > 5) {
      insights.push({
        type: 'balance',
        title: 'Kişisel Gün',
        message: 'Bugün çoğunlukla kişisel görevlerin var. İyi bir denge!',
        severity: 'info',
        metric: `${Math.round(workPercent)}% iş`,
      });
    }

    return insights;
  }

  /**
   * Analyze stress level
   */
  private async analyzeStressLevel(
    responsibilities: Responsibility[],
    today: Date
  ): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const tomorrow = addDays(today, 1);

    const todayTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      isAfter(r.schedule.datetime, today) &&
      isBefore(r.schedule.datetime, tomorrow)
    );

    const criticalTasks = todayTasks.filter(r => r.reminderStyle === 'critical');
    const missedCount = responsibilities.filter(r => r.status === 'missed').length;
    const totalTasks = todayTasks.length;

    // High stress indicators
    if (criticalTasks.length >= 3) {
      insights.push({
        type: 'stress',
        title: 'Yüksek Stres Riski',
        message: `Bugün ${criticalTasks.length} kritik görevin var. Mola vermeyi unutma.`,
        severity: 'warning',
        suggestion: 'Görevler arasında 10-15 dakika mola ver.',
        metric: `${criticalTasks.length} kritik görev`,
      });
    }

    if (totalTasks > 8) {
      insights.push({
        type: 'stress',
        title: 'Yoğun Gün',
        message: `Bugün ${totalTasks} görevin var. Bazılarını yarına ertelemek ister misin?`,
        severity: 'warning',
        suggestion: 'Öncelikli olmayan görevleri yarına al.',
        metric: `${totalTasks} görev`,
      });
    }

    if (missedCount >= 5) {
      insights.push({
        type: 'stress',
        title: 'Biraz Yavaşla',
        message: `${missedCount} görev kaçırıldı. Sorun yok, hayat böyle. Biraz yavaşlamak ister misin?`,
        severity: 'info',
        suggestion: 'Günlük hedefini azaltmayı düşün.',
        metric: `${missedCount} kaçırılan`,
      });
    }

    return insights;
  }

  /**
   * Analyze rest and recovery
   */
  private async analyzeRest(
    responsibilities: Responsibility[],
    today: Date
  ): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const tomorrow = addDays(today, 1);
    const now = new Date();
    const currentHour = getHours(now);

    const todayTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      isAfter(r.schedule.datetime, today) &&
      isBefore(r.schedule.datetime, tomorrow)
    );

    // Check for back-to-back tasks
    const sorted = [...todayTasks].sort((a, b) =>
      a.schedule.datetime.getTime() - b.schedule.datetime.getTime()
    );

    let consecutiveTasks = 0;
    let maxConsecutive = 0;
    let hasBreaks = false;

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].schedule.datetime.getTime() - sorted[i].schedule.datetime.getTime();
      if (gap < 30 * 60 * 1000) { // Less than 30 minutes
        consecutiveTasks++;
        maxConsecutive = Math.max(maxConsecutive, consecutiveTasks);
      } else {
        consecutiveTasks = 0;
        hasBreaks = true;
      }
    }

    if (maxConsecutive >= 3) {
      insights.push({
        type: 'rest',
        title: 'Mola Zamanı',
        message: 'Arka arkaya birçok görevin var. Mola vermeyi unutma.',
        severity: 'warning',
        suggestion: 'Görevler arasında en az 30 dakika mola ver.',
        metric: `${maxConsecutive} arka arkaya görev`,
      });
    }

    // Evening check - suggest winding down
    if (currentHour >= 20 && todayTasks.length > 0) {
      const eveningTasks = todayTasks.filter(r => {
        const taskHour = getHours(r.schedule.datetime);
        return taskHour >= 20;
      });

      if (eveningTasks.length > 0) {
        insights.push({
          type: 'rest',
          title: 'Dinlenme Zamanı',
          message: `Akşam ${eveningTasks.length} görevin var. Yarına ertelemek ister misin?`,
          severity: 'info',
          suggestion: 'İyi bir uyku için akşam görevlerini azalt.',
          metric: `${eveningTasks.length} akşam görevi`,
        });
      }
    }

    return insights;
  }

  /**
   * Analyze productivity patterns
   */
  private async analyzeProductivity(
    responsibilities: Responsibility[],
    weekAgo: Date
  ): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const now = new Date();

    const recentCompleted = responsibilities.filter(r =>
      r.status === 'completed' &&
      r.completedAt &&
      isAfter(r.completedAt, weekAgo)
    );

    const recentMissed = responsibilities.filter(r =>
      r.status === 'missed' &&
      isAfter(r.schedule.datetime, weekAgo) &&
      isBefore(r.schedule.datetime, now)
    );

    const total = recentCompleted.length + recentMissed.length;
    const completionRate = total > 0 ? (recentCompleted.length / total) * 100 : 0;

    if (completionRate >= 85 && recentCompleted.length >= 10) {
      insights.push({
        type: 'productivity',
        title: 'Harika İlerleme!',
        message: `Son haftada ${recentCompleted.length} görev tamamladın. %${Math.round(completionRate)} başarı oranı!`,
        severity: 'info',
        metric: `%${Math.round(completionRate)} başarı`,
      });
    } else if (completionRate < 50 && total >= 5) {
      insights.push({
        type: 'productivity',
        title: 'Yavaşlamak Normal',
        message: `Tamamlama oranın %${Math.round(completionRate)}. Sorun yok, belki hedeflerini küçültmek ister misin?`,
        severity: 'info',
        suggestion: 'Günlük görev sayısını azaltmayı düşün.',
        metric: `%${Math.round(completionRate)} başarı`,
      });
    }

    return insights;
  }

  /**
   * Analyze energy management
   */
  private async analyzeEnergyManagement(
    responsibilities: Responsibility[],
    today: Date
  ): Promise<WellnessInsight[]> {
    const insights: WellnessInsight[] = [];
    const tomorrow = addDays(today, 1);
    const now = new Date();
    const currentHour = getHours(now);

    const todayTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      isAfter(r.schedule.datetime, today) &&
      isBefore(r.schedule.datetime, tomorrow)
    );

    const highEnergyTasks = todayTasks.filter(r => r.energyRequired === 'high');
    const lowEnergyTasks = todayTasks.filter(r => r.energyRequired === 'low');

    // Check energy distribution
    const highPercent = todayTasks.length > 0
      ? (highEnergyTasks.length / todayTasks.length) * 100
      : 0;

    if (highPercent > 70 && todayTasks.length >= 5) {
      insights.push({
        type: 'energy',
        title: 'Yüksek Enerji Yükü',
        message: `Görevlerinin %${Math.round(highPercent)}'i yüksek enerji gerektiriyor. Düşük enerji görevleri eklemek ister misin?`,
        severity: 'warning',
        suggestion: 'Düşük enerji görevleri ekleyerek dengeyi sağla.',
        metric: `%${Math.round(highPercent)} yüksek enerji`,
      });
    }

    // Check for energy mismatches in current time
    const isLowEnergyTime = currentHour >= 22 || currentHour <= 6 || (currentHour >= 14 && currentHour <= 16);
    const upcomingHighEnergy = todayTasks.filter(r => {
      const taskHour = getHours(r.schedule.datetime);
      return r.energyRequired === 'high' && 
             taskHour >= currentHour && 
             taskHour <= currentHour + 2;
    });

    if (isLowEnergyTime && upcomingHighEnergy.length > 0) {
      insights.push({
        type: 'energy',
        title: 'Enerji Uyumsuzluğu',
        message: `Şu an düşük enerji zamanı ama ${upcomingHighEnergy.length} yüksek enerji görevin var. Ertelemek ister misin?`,
        severity: 'info',
        suggestion: 'Yüksek enerji görevlerini sabah erken saatlere al.',
        metric: `${upcomingHighEnergy.length} uyumsuz görev`,
      });
    }

    return insights;
  }

  /**
   * Get most critical wellness insight
   */
  async getCriticalInsight(): Promise<WellnessInsight | null> {
    const insights = await this.analyzeWellness();
    const critical = insights.find(i => i.severity === 'critical');
    if (critical) return critical;

    const warning = insights.find(i => i.severity === 'warning');
    if (warning) return warning;

    return insights[0] || null;
  }
}

export const wellnessInsightsService = new WellnessInsightsService();

