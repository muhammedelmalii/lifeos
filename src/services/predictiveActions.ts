/**
 * Predictive Actions Service
 * Predicts future needs and prepares proactively
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { addDays, startOfDay, isAfter, isBefore, getDay, format } from 'date-fns';
import { smartAutomationService } from './smartAutomation';
import { proactiveHelpService } from './proactiveHelp';

export interface PredictiveAction {
  type: 'prepare' | 'reschedule' | 'suggest' | 'warn';
  title: string;
  description: string;
  predictedDate: Date;
  confidence: number;
  action?: () => Promise<void>;
}

class PredictiveActionsService {
  /**
   * Get predictive actions for upcoming period
   */
  async getPredictiveActions(daysAhead: number = 7): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const now = new Date();
    const futureDate = addDays(now, daysAhead);

    // 1. Predict overloaded days
    actions.push(...await this.predictOverloadedDays(now, futureDate));

    // 2. Predict optimal rescheduling opportunities
    actions.push(...await this.predictReschedulingNeeds(now, futureDate));

    // 3. Predict preparation needs
    actions.push(...await this.predictPreparationNeeds(now, futureDate));

    // 4. Predict habit maintenance needs
    actions.push(...await this.predictHabitNeeds(now, futureDate));

    // 5. Predict conflict risks
    actions.push(...await this.predictConflicts(now, futureDate));

    return actions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Predict days that will be overloaded
   */
  private async predictOverloadedDays(
    start: Date,
    end: Date
  ): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;

    // Group tasks by day
    const tasksByDay = new Map<string, Responsibility[]>();

    responsibilities
      .filter(r => r.status === 'active')
      .forEach(r => {
        const dayKey = format(startOfDay(r.schedule.datetime), 'yyyy-MM-dd');
        if (!tasksByDay.has(dayKey)) {
          tasksByDay.set(dayKey, []);
        }
        tasksByDay.get(dayKey)!.push(r);
      });

    // Find overloaded days
    for (const [dayKey, tasks] of tasksByDay.entries()) {
      const dayDate = new Date(dayKey);
      if (isAfter(dayDate, start) && isBefore(dayDate, end) && tasks.length > 6) {
        const criticalCount = tasks.filter(t => t.reminderStyle === 'critical').length;
        
        actions.push({
          type: 'warn',
          title: 'Yoğun Gün Tahmini',
          description: `${format(dayDate, 'dd MMMM')} günü ${tasks.length} görevin var${criticalCount > 0 ? ` (${criticalCount} kritik)` : ''}. Şimdiden hazırlanmak ister misin?`,
          predictedDate: dayDate,
          confidence: tasks.length > 8 ? 0.9 : 0.7,
          action: async () => {
            // Could show preparation checklist or suggest rescheduling
            console.log(`Preparing for overloaded day: ${dayKey}`);
          },
        });
      }
    }

    return actions;
  }

  /**
   * Predict rescheduling needs based on patterns
   */
  private async predictReschedulingNeeds(
    start: Date,
    end: Date
  ): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const patterns = await smartAutomationService.getUserPatterns();

    if (!patterns) return actions;

    // Find tasks scheduled at non-productive hours
    const upcomingTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      isAfter(r.schedule.datetime, start) &&
      isBefore(r.schedule.datetime, end)
    );

    for (const task of upcomingTasks) {
      const taskHour = task.schedule.datetime.getHours();
      const isProductiveHour = patterns.productiveHours.includes(taskHour);

      // High energy task at non-productive hour
      if (task.energyRequired === 'high' && !isProductiveHour) {
        const optimalTime = await smartAutomationService.suggestOptimalTime(task);
        if (optimalTime) {
          actions.push({
            type: 'reschedule',
            title: 'Daha İyi Zaman Önerisi',
            description: `"${task.title}" şu an planlandığı saatte verimli olmayabilir. Daha iyi bir zaman önerebilirim.`,
            predictedDate: task.schedule.datetime,
            confidence: 0.7,
            action: async () => {
              await useResponsibilitiesStore.getState().updateResponsibility(task.id, {
                schedule: {
                  ...task.schedule,
                  datetime: optimalTime,
                },
              });
            },
          });
        }
      }
    }

    return actions;
  }

  /**
   * Predict preparation needs
   */
  private async predictPreparationNeeds(
    start: Date,
    end: Date
  ): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;

    // Find critical tasks in the next 3 days
    const criticalUpcoming = responsibilities.filter(r =>
      r.status === 'active' &&
      r.reminderStyle === 'critical' &&
      isAfter(r.schedule.datetime, start) &&
      isBefore(r.schedule.datetime, addDays(start, 3))
    );

    for (const task of criticalUpcoming) {
      const daysUntil = Math.floor(
        (task.schedule.datetime.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil === 1) {
        // Tomorrow - suggest preparation today
        actions.push({
          type: 'prepare',
          title: 'Yarın İçin Hazırlık',
          description: `"${task.title}" yarın. Bugün hazırlık yapmak ister misin?`,
          predictedDate: task.schedule.datetime,
          confidence: 0.8,
          action: async () => {
            // Could show preparation checklist
            console.log(`Preparing for: ${task.title}`);
          },
        });
      }
    }

    return actions;
  }

  /**
   * Predict habit maintenance needs
   */
  private async predictHabitNeeds(
    start: Date,
    end: Date
  ): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;

    // Find recurring tasks
    const recurring = responsibilities.filter(r =>
      r.schedule.type === 'recurring' &&
      r.status === 'active'
    );

    for (const task of recurring) {
      if (task.schedule.rrule?.includes('FREQ=DAILY')) {
        // Check if this daily habit might be missed
        const nextOccurrence = this.getNextRecurrence(task, start);
        
        if (nextOccurrence && isBefore(nextOccurrence, end)) {
          // Check if user has been consistent
          const recentCompletions = responsibilities.filter(r =>
            r.title === task.title &&
            r.status === 'completed' &&
            isAfter(r.completedAt || new Date(), addDays(start, -7))
          );

          if (recentCompletions.length < 5) {
            // Might need encouragement
            actions.push({
              type: 'suggest',
              title: 'Alışkanlık Hatırlatması',
              description: `"${task.title}" alışkanlığını devam ettirmek için hatırlatma ister misin?`,
              predictedDate: nextOccurrence,
              confidence: 0.6,
            });
          }
        }
      }
    }

    return actions;
  }

  /**
   * Predict potential conflicts
   */
  private async predictConflicts(
    start: Date,
    end: Date
  ): Promise<PredictiveAction[]> {
    const actions: PredictiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;

    const upcoming = responsibilities
      .filter(r =>
        r.status === 'active' &&
        isAfter(r.schedule.datetime, start) &&
        isBefore(r.schedule.datetime, end)
      )
      .sort((a, b) => a.schedule.datetime.getTime() - b.schedule.datetime.getTime());

    // Check for conflicts
    for (let i = 0; i < upcoming.length - 1; i++) {
      const current = upcoming[i];
      const next = upcoming[i + 1];
      
      const currentEnd = new Date(current.schedule.datetime.getTime() + 60 * 60 * 1000);
      if (next.schedule.datetime < currentEnd) {
        actions.push({
          type: 'warn',
          title: 'Çakışma Riski',
          description: `"${current.title}" ve "${next.title}" aynı saatte. Şimdiden ayarlamak ister misin?`,
          predictedDate: current.schedule.datetime,
          confidence: 0.9,
          action: async () => {
            const suggested = await smartAutomationService.suggestOptimalTime(next);
            if (suggested) {
              await useResponsibilitiesStore.getState().updateResponsibility(next.id, {
                schedule: {
                  ...next.schedule,
                  datetime: suggested,
                },
              });
            }
          },
        });
      }
    }

    return actions;
  }

  /**
   * Get next occurrence of a recurring task
   */
  private getNextRecurrence(task: Responsibility, from: Date): Date | null {
    // Simple implementation - in production would use RRULE parser
    if (task.schedule.rrule?.includes('FREQ=DAILY')) {
      const next = new Date(from);
      next.setDate(next.getDate() + 1);
      next.setHours(
        task.schedule.datetime.getHours(),
        task.schedule.datetime.getMinutes(),
        0,
        0
      );
      return next;
    }
    return null;
  }
}

export const predictiveActionsService = new PredictiveActionsService();

