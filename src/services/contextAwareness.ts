/**
 * Context Awareness System
 * Understands user's current situation and adapts accordingly
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { getHours, isAfter, isBefore, addHours, addDays, startOfDay } from 'date-fns';

export interface UserContext {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  energyLevel: 'low' | 'medium' | 'high';
  workload: 'light' | 'moderate' | 'heavy' | 'overloaded';
  focusLevel: 'distracted' | 'focused' | 'deep';
  availableTime: number; // Minutes until next task
  currentTask?: Responsibility;
  nextTask?: Responsibility;
  stressLevel: 'low' | 'medium' | 'high';
}

class ContextAwarenessService {
  /**
   * Get current user context
   */
  async getContext(): Promise<UserContext> {
    const now = new Date();
    const hour = getHours(now);
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;

    // Determine time of day
    let timeOfDay: UserContext['timeOfDay'];
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    // Estimate energy level based on time
    let energyLevel: UserContext['energyLevel'] = 'medium';
    if (timeOfDay === 'morning') energyLevel = 'high';
    else if (timeOfDay === 'afternoon') energyLevel = 'medium';
    else if (timeOfDay === 'evening') energyLevel = 'low';
    else energyLevel = 'low';

    // Calculate workload
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);
    const todayTasks = responsibilities.filter(r => {
      if (r.status !== 'active' || !r.schedule?.datetime) return false;
      try {
        return r.schedule.datetime >= today && r.schedule.datetime < tomorrow;
      } catch {
        return false;
      }
    });

    let workload: UserContext['workload'] = 'light';
    if (todayTasks.length === 0) workload = 'light';
    else if (todayTasks.length <= 3) workload = 'moderate';
    else if (todayTasks.length <= 6) workload = 'heavy';
    else workload = 'overloaded';

    // Find current and next tasks
    const activeTasks = responsibilities
      .filter(r => r.status === 'active' && r.schedule?.datetime)
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });

    const currentTask = activeTasks.find(r => {
      if (!r.schedule?.datetime) return false;
      try {
        return isBefore(r.schedule.datetime, now) &&
               isAfter(addHours(r.schedule.datetime, 2), now);
      } catch {
        return false;
      }
    });

    const nextTask = activeTasks.find(r => {
      if (!r.schedule?.datetime) return false;
      try {
        return isAfter(r.schedule.datetime, now);
      } catch {
        return false;
      }
    });

    // Calculate available time
    const availableTime = nextTask
      ? Math.max(0, (nextTask.schedule.datetime.getTime() - now.getTime()) / (1000 * 60))
      : 60; // Default 1 hour if no next task

    // Estimate focus level
    let focusLevel: UserContext['focusLevel'] = 'focused';
    if (workload === 'overloaded') focusLevel = 'distracted';
    else if (availableTime > 120 && workload === 'light') focusLevel = 'deep';

    // Estimate stress level
    let stressLevel: UserContext['stressLevel'] = 'low';
    const missedCount = responsibilities.filter(r => r.status === 'missed').length;
    const criticalCount = todayTasks.filter(r => r.reminderStyle === 'critical').length;
    
    if (workload === 'overloaded' || criticalCount >= 3) stressLevel = 'high';
    else if (missedCount >= 3 || criticalCount >= 1) stressLevel = 'medium';

    // Adjust energy based on actual task completion patterns
    const completedToday = responsibilities.filter(r =>
      r.status === 'completed' &&
      r.completedAt &&
      isAfter(r.completedAt, today)
    );

    // If user completed many tasks, might be tired
    if (completedToday.length >= 5) {
      energyLevel = energyLevel === 'high' ? 'medium' : 'low';
    }

    return {
      timeOfDay,
      energyLevel,
      workload,
      focusLevel,
      availableTime: Math.floor(availableTime),
      currentTask,
      nextTask,
      stressLevel,
    };
  }

  /**
   * Get context-aware suggestions
   */
  async getContextualSuggestions(): Promise<string[]> {
    const context = await this.getContext();
    const suggestions: string[] = [];

    // Workload-based suggestions
    if (context.workload === 'overloaded') {
      suggestions.push('Bugün çok dolu görünüyor. Bazı görevleri yarına ertelemek ister misin?');
    } else if (context.workload === 'light') {
      suggestions.push('Bugün rahat bir gün. Şimdi yapabileceğin küçük görevler var mı?');
    }

    // Energy-based suggestions
    if (context.energyLevel === 'low' && context.nextTask?.energyRequired === 'high') {
      suggestions.push(`"${context.nextTask.title}" yüksek enerji gerektiriyor ama şu an düşük enerji zamanı. Ertelemek ister misin?`);
    } else if (context.energyLevel === 'high' && context.workload === 'light') {
      suggestions.push('Yüksek enerji zamanı! Zor görevleri şimdi yapmak için ideal.');
    }

    // Time-based suggestions
    if (context.availableTime < 30 && context.nextTask) {
      suggestions.push(`"${context.nextTask.title}" için ${Math.floor(context.availableTime)} dakika kaldı. Hazırlanmak ister misin?`);
    } else if (context.availableTime > 60 && context.workload === 'moderate') {
      suggestions.push(`${Math.floor(context.availableTime / 60)} saat boş zamanın var. Şimdi yapabileceğin bir şey var mı?`);
    }

    // Stress-based suggestions
    if (context.stressLevel === 'high') {
      suggestions.push('Bugün biraz yoğun görünüyor. Mola vermeyi unutma.');
    }

    // Focus-based suggestions
    if (context.focusLevel === 'deep' && context.workload === 'light') {
      suggestions.push('Derin odaklanma zamanı. Önemli görevleri şimdi yapmak için ideal.');
    }

    return suggestions;
  }

  /**
   * Should show gentle UI (based on stress/workload)
   */
  shouldShowGentleUI(): boolean {
    // This would be called from UI components
    // For now, return based on typical patterns
    return true; // LifeOS always gentle
  }

  /**
   * Get recommended actions based on context
   */
  async getRecommendedActions(): Promise<Array<{ action: string; reason: string }>> {
    const context = await this.getContext();
    const actions: Array<{ action: string; reason: string }> = [];

    if (context.workload === 'overloaded') {
      actions.push({
        action: 'Reschedule some tasks',
        reason: 'Workload is too heavy today',
      });
    }

    if (context.stressLevel === 'high') {
      actions.push({
        action: 'Take a break',
        reason: 'High stress detected',
      });
    }

    if (context.energyLevel === 'low' && context.nextTask?.energyRequired === 'high') {
      actions.push({
        action: 'Reschedule high-energy task',
        reason: 'Energy mismatch',
      });
    }

    return actions;
  }
}

export const contextAwarenessService = new ContextAwarenessService();

