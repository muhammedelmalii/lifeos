/**
 * Proactive Help System
 * Helps users without them asking - truly makes life easier
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useSettingsStore } from '@/store/settings';
import { format, addHours, addDays, startOfDay, isAfter, isBefore, getHours } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { smartNotificationsService } from './smartNotifications';

export interface ProactiveAction {
  type: 'reminder' | 'reschedule' | 'break' | 'prepare' | 'suggest' | 'warn';
  title: string;
  message: string;
  action?: () => Promise<void>;
  priority: 'low' | 'medium' | 'high';
  autoExecute?: boolean; // If true, executes without user confirmation
}

class ProactiveHelpService {
  private lastCheck: Date = new Date();

  /**
   * Check for proactive actions needed
   * Runs periodically to help users
   */
  async checkAndHelp(): Promise<ProactiveAction[]> {
    const now = new Date();
    const actions: ProactiveAction[] = [];

    // 1. Check for upcoming critical tasks (prepare user)
    actions.push(...await this.prepareForUpcoming());

    // 2. Check for overloaded days (suggest breaks)
    actions.push(...await this.suggestBreaks());

    // 3. Check for missed patterns (gentle reminders)
    actions.push(...await this.gentleReminders());

    // 4. Check for optimal rescheduling opportunities
    actions.push(...await this.suggestOptimalReschedules());

    // 5. Check for preparation needs (tomorrow's tasks)
    actions.push(...await this.prepareForTomorrow());

    // 6. Check for energy mismatches
    actions.push(...await this.fixEnergyMismatches());

    // 7. Check for habit maintenance
    actions.push(...await this.maintainHabits());

    this.lastCheck = now;
    return actions;
  }

  /**
   * Prepare user for upcoming critical tasks
   */
  private async prepareForUpcoming(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const next24Hours = addHours(now, 24);

    const criticalUpcoming = responsibilities.filter(r => 
      r.status === 'active' &&
      r.schedule?.datetime &&
      r.reminderStyle === 'critical' &&
      isAfter(r.schedule.datetime, now) &&
      isBefore(r.schedule.datetime, next24Hours)
    );

    for (const task of criticalUpcoming) {
      if (!task.schedule?.datetime) continue;
      const hoursUntil = (task.schedule.datetime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Remind 2 hours before
      if (hoursUntil <= 2 && hoursUntil > 1.5) {
        const minutesUntil = Math.round(hoursUntil * 60);
        const timeText = minutesUntil < 60 
          ? `${minutesUntil} dakika` 
          : `${Math.round(hoursUntil)} saat`;
        
        actions.push({
          type: 'prepare',
          title: 'Hazırlık Zamanı',
          message: `"${task.title}" için ${timeText} kaldı. Hazırlık yapmak ister misin?`,
          priority: 'high',
          autoExecute: false,
          action: async () => {
            // Could navigate to task detail or show preparation checklist
            console.log(`Preparing for: ${task.title}`);
          },
        });
      }

      // Remind 30 minutes before (or if less than 30 min)
      if (hoursUntil <= 0.5 && hoursUntil > 0) {
        const minutesUntil = Math.round(hoursUntil * 60);
        const timeText = minutesUntil === 0 ? '0 dakika' : `${minutesUntil} dakika`;
        
        actions.push({
          type: 'reminder',
          title: minutesUntil === 0 ? 'Size Yardımcı Olabilirim' : 'Yaklaşıyor',
          message: `"${task.title}" için ${timeText} kaldı. ${minutesUntil === 0 ? 'Hazırlanmak ister misin?' : ''}`,
          priority: 'high',
          autoExecute: minutesUntil === 0, // Auto-send notification if 0 minutes
          action: async () => {
            await smartNotificationsService.sendContextualReminder(task);
          },
        });
      }
    }

    return actions;
  }

  /**
   * Suggest breaks when overloaded
   */
  private async suggestBreaks(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);

    const todayTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      r.schedule?.datetime &&
      isAfter(r.schedule.datetime, today) &&
      isBefore(r.schedule.datetime, tomorrow)
    );

    // If more than 6 tasks today, suggest breaks
    if (todayTasks.length > 6) {
      // Check for back-to-back tasks
      const sorted = [...todayTasks].sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });

      let hasBackToBack = false;
      for (let i = 0; i < sorted.length - 1; i++) {
        if (!sorted[i].schedule?.datetime || !sorted[i + 1].schedule?.datetime) continue;
        const gap = sorted[i + 1].schedule.datetime.getTime() - sorted[i].schedule.datetime.getTime();
        if (gap < 30 * 60 * 1000) { // Less than 30 minutes
          hasBackToBack = true;
          break;
        }
      }

      if (hasBackToBack) {
        actions.push({
          type: 'break',
          title: 'Mola Zamanı',
          message: `Bugün ${todayTasks.length} görevin var ve bazıları arka arkaya. Mola vermeyi unutma.`,
          priority: 'medium',
          autoExecute: false,
        });
      }
    }

    return actions;
  }

  /**
   * Gentle reminders for missed patterns
   */
  private async gentleReminders(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const yesterday = addDays(now, -1);

    const recentMissed = responsibilities.filter(r =>
      r.status === 'missed' &&
      r.schedule?.datetime &&
      isAfter(r.schedule.datetime, yesterday) &&
      isBefore(r.schedule.datetime, now)
    );

    // If user has 3+ missed tasks recently, gentle reminder
    if (recentMissed.length >= 3) {
      actions.push({
        type: 'suggest',
        title: 'Yardım Edebilirim',
        message: `Son zamanlarda ${recentMissed.length} görev kaçırıldı. Zamanlamayı birlikte ayarlayalım mı?`,
        priority: 'low',
        autoExecute: false,
      });
    }

    return actions;
  }

  /**
   * Suggest optimal reschedules
   */
  private async suggestOptimalReschedules(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const currentHour = getHours(now);

    // Low energy times: late night (22-6) or afternoon slump (14-16)
    const isLowEnergyTime = currentHour >= 22 || currentHour <= 6 || (currentHour >= 14 && currentHour <= 16);

    const mismatched = responsibilities.filter(r => {
      if (r.status !== 'active') return false;
      if (!r.schedule?.datetime) return false;
      if (!isAfter(r.schedule.datetime, now)) return false;
      if (!isBefore(r.schedule.datetime, addDays(now, 1))) return false;
      
      return isLowEnergyTime && r.energyRequired === 'high';
    });

    for (const task of mismatched.slice(0, 2)) { // Max 2 suggestions
      actions.push({
        type: 'reschedule',
        title: 'Daha İyi Bir Zaman',
        message: `"${task.title}" yüksek enerji gerektiriyor ama şu an düşük enerji zamanı. Yarın sabah erken saatlere almak ister misin?`,
        priority: 'medium',
        autoExecute: false,
        action: async () => {
          const tomorrow = addDays(startOfDay(now), 1);
          tomorrow.setHours(9, 0, 0, 0);
          await useResponsibilitiesStore.getState().updateResponsibility(task.id, {
            schedule: {
              ...task.schedule,
              datetime: tomorrow,
            },
          });
        },
      });
    }

    return actions;
  }

  /**
   * Prepare for tomorrow's tasks
   */
  private async prepareForTomorrow(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const currentHour = getHours(now);
    
    // Only suggest in evening (after 8 PM)
    if (currentHour < 20) return actions;

    const tomorrow = addDays(startOfDay(now), 1);
    const dayAfter = addDays(tomorrow, 1);

    const tomorrowTasks = responsibilities.filter(r =>
      r.status === 'active' &&
      r.schedule?.datetime &&
      isAfter(r.schedule.datetime, tomorrow) &&
      isBefore(r.schedule.datetime, dayAfter)
    );

    if (tomorrowTasks.length > 0) {
      const criticalCount = tomorrowTasks.filter(r => r.reminderStyle === 'critical').length;
      
      if (criticalCount > 0) {
        actions.push({
          type: 'prepare',
          title: 'Yarın İçin Hazırlık',
          message: `Yarın ${criticalCount} kritik görevin var. Şimdi hazırlık yapmak ister misin?`,
          priority: 'medium',
          autoExecute: false,
        });
      } else if (tomorrowTasks.length >= 5) {
        actions.push({
          type: 'prepare',
          title: 'Yarın Dolu Bir Gün',
          message: `Yarın ${tomorrowTasks.length} görevin var. Erken başlamak için hazırlık yapmak ister misin?`,
          priority: 'low',
          autoExecute: false,
        });
      }
    }

    return actions;
  }

  /**
   * Fix energy mismatches automatically
   */
  private async fixEnergyMismatches(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const currentHour = getHours(now);

    // Morning (6-12): High energy time
    // Afternoon (12-18): Medium energy time
    // Evening (18-22): Low energy time
    // Night (22-6): Very low energy time

    let optimalEnergy: 'low' | 'medium' | 'high' = 'medium';
    if (currentHour >= 6 && currentHour < 12) optimalEnergy = 'high';
    else if (currentHour >= 18 || currentHour < 6) optimalEnergy = 'low';

    const nextTasks = responsibilities
      .filter(r =>
        r.status === 'active' &&
        r.schedule?.datetime &&
        isAfter(r.schedule.datetime, now) &&
        isBefore(r.schedule.datetime, addHours(now, 3))
      )
      .slice(0, 3);

    const mismatched = nextTasks.filter(r => r.energyRequired !== optimalEnergy);

    if (mismatched.length > 0 && optimalEnergy !== 'medium') {
      actions.push({
        type: 'suggest',
        title: 'Enerji Uyumu',
        message: `Şu an ${optimalEnergy === 'high' ? 'yüksek' : 'düşük'} enerji zamanı. ${mismatched.length} görevini buna göre ayarlamak ister misin?`,
        priority: 'low',
        autoExecute: false,
      });
    }

    return actions;
  }

  /**
   * Maintain habits (recurring tasks)
   */
  private async maintainHabits(): Promise<ProactiveAction[]> {
    const actions: ProactiveAction[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const weekAgo = addDays(now, -7);

    // Find recurring tasks that haven't been completed recently
    const recurring = responsibilities.filter(r =>
      r.schedule.type === 'recurring' &&
      r.status === 'active'
    );

    for (const task of recurring) {
      // Check if this task was completed in the last week
      const recentCompletions = responsibilities.filter(r =>
        r.title === task.title &&
        r.status === 'completed' &&
        r.completedAt &&
        isAfter(r.completedAt, weekAgo)
      );

      // If it's a daily task and hasn't been completed in 2 days
      if (task.schedule.rrule?.includes('FREQ=DAILY') && recentCompletions.length === 0) {
        const lastCompletion = responsibilities
          .filter(r => r.title === task.title && r.status === 'completed' && r.completedAt)
          .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))[0];

        if (lastCompletion?.completedAt) {
          const daysSince = (now.getTime() - lastCompletion.completedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince >= 2) {
            actions.push({
              type: 'reminder',
              title: 'Alışkanlık Hatırlatması',
              message: `"${task.title}" alışkanlığını ${Math.floor(daysSince)} gündür yapmıyorsun. Devam etmek ister misin?`,
              priority: 'low',
              autoExecute: false,
            });
          }
        }
      }
    }

    return actions;
  }

  /**
   * Execute auto-executable actions
   */
  async executeAutoActions(actions: ProactiveAction[]): Promise<void> {
    for (const action of actions) {
      if (action.autoExecute && action.action) {
        try {
          await action.action();
        } catch (error) {
          console.error(`Error executing auto action ${action.type}:`, error);
        }
      }
    }
  }

  /**
   * Get actionable suggestions for user
   */
  async getSuggestions(): Promise<ProactiveAction[]> {
    const allActions = await this.checkAndHelp();
    
    // Execute auto actions
    const autoActions = allActions.filter(a => a.autoExecute);
    await this.executeAutoActions(autoActions);

    // Return user-facing suggestions
    return allActions.filter(a => !a.autoExecute);
  }
}

export const proactiveHelpService = new ProactiveHelpService();

