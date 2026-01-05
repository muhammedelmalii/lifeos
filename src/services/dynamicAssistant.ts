/**
 * Dynamic Personal Assistant Service
 * Proactively helps users by analyzing data and taking actions automatically
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { useListsStore } from '@/store/lists';
import { analyticsService } from './analytics';
import { proactiveHelpService, ProactiveAction } from './proactiveHelp';
import { smartNotificationsService } from './smartNotifications';
import { format, addHours, addDays, startOfDay, isAfter, isBefore, differenceInMinutes } from 'date-fns';
import { Platform } from 'react-native';

export interface DynamicUpdate {
  type: 'notification' | 'update' | 'suggestion' | 'optimization';
  title: string;
  message: string;
  action?: () => Promise<void>;
  priority: 'low' | 'medium' | 'high';
  autoExecute?: boolean;
  data?: any;
}

class DynamicAssistantService {
  private lastAnalysis: Date = new Date();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Start continuous monitoring and updates
   */
  startMonitoring() {
    // Check every 5 minutes
    this.updateInterval = setInterval(() => {
      this.analyzeAndUpdate();
    }, 5 * 60 * 1000);

    // Initial analysis
    this.analyzeAndUpdate();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Main analysis and update function
   */
  async analyzeAndUpdate(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const now = new Date();

    // 1. Analyze responsibilities and auto-update statuses
    updates.push(...await this.autoUpdateStatuses());

    // 2. Send proactive notifications based on data
    updates.push(...await this.sendProactiveNotifications());

    // 3. Optimize schedules automatically
    updates.push(...await this.optimizeSchedules());

    // 4. Update lists based on patterns
    updates.push(...await this.updateListsIntelligently());

    // 5. Suggest improvements based on analytics
    updates.push(...await this.suggestImprovements());

    // Execute auto-updates
    for (const update of updates) {
      if (update.autoExecute && update.action) {
        try {
          await update.action();
        } catch (error) {
          console.error('Error executing auto-update:', error);
        }
      }
    }

    this.lastAnalysis = now;
    return updates.filter(u => !u.autoExecute); // Return only user-facing updates
  }

  /**
   * Automatically update responsibility statuses
   */
  private async autoUpdateStatuses(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const now = new Date();
    const { updateResponsibility } = useResponsibilitiesStore.getState();

    for (const resp of responsibilities) {
      if (resp.status !== 'active' || !resp.schedule?.datetime) continue;

      const taskTime = resp.schedule.datetime;
      const minutesUntil = differenceInMinutes(taskTime, now);

      // Auto-mark as missed if past due (more than 30 minutes)
      if (minutesUntil < -30 && resp.status === 'active') {
        await updateResponsibility(resp.id, { 
          status: 'missed',
        });
        
        updates.push({
          type: 'update',
          title: 'Görev Güncellendi',
          message: `"${resp.title}" kaçırıldı olarak işaretlendi.`,
          priority: 'medium',
          autoExecute: true,
        });
      }

      // Auto-snooze if approaching and user hasn't interacted
      if (minutesUntil > 0 && minutesUntil < 15 && resp.reminderStyle === 'gentle') {
        // Could auto-snooze here if needed
      }
    }

    return updates;
  }

  /**
   * Send proactive notifications based on data analysis
   */
  private async sendProactiveNotifications(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const now = new Date();
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const analytics = analyticsService.getTodayStats();

    // Notification 1: Low completion rate warning
    if (analytics.total > 0 && analytics.completionRate < 50 && now.getHours() >= 14) {
      updates.push({
        type: 'notification',
        title: 'Günün Yarısı Geçti',
        message: `Bugün ${analytics.completed}/${analytics.total} görev tamamlandı. Devam edebilirsin!`,
        priority: 'medium',
        autoExecute: false,
        action: async () => {
          if (Platform.OS !== 'web') {
            await smartNotificationsService.scheduleSmartNotification({
              title: 'Günün Yarısı Geçti',
              body: `Bugün ${analytics.completed}/${analytics.total} görev tamamlandı.`,
              data: { type: 'daily_reminder' },
              priority: 'medium',
              timing: 'immediate',
            });
          }
        },
      });
    }

    // Notification 2: Upcoming critical task
    const criticalUpcoming = responsibilities
      .filter(r => 
        r.status === 'active' &&
        r.schedule?.datetime &&
        r.reminderStyle === 'critical' &&
        isAfter(r.schedule.datetime, now) &&
        isBefore(r.schedule.datetime, addHours(now, 2))
      )
      .sort((a, b) => a.schedule!.datetime.getTime() - b.schedule!.datetime.getTime())[0];

    if (criticalUpcoming && criticalUpcoming.schedule?.datetime) {
      const minutesUntil = differenceInMinutes(criticalUpcoming.schedule.datetime, now);
      if (minutesUntil <= 60 && minutesUntil > 0) {
        updates.push({
          type: 'notification',
          title: 'Yaklaşan Kritik Görev',
          message: `"${criticalUpcoming.title}" için ${minutesUntil} dakika kaldı.`,
          priority: 'high',
          autoExecute: false,
          action: async () => {
            if (Platform.OS !== 'web') {
              await smartNotificationsService.scheduleSmartNotification({
                title: 'Yaklaşan Kritik Görev',
                body: `"${criticalUpcoming.title}" için ${minutesUntil} dakika kaldı.`,
                data: { type: 'critical_reminder', responsibilityId: criticalUpcoming.id },
                priority: 'high',
                timing: 'immediate',
              });
            }
          },
        });
      }
    }

    // Notification 3: High productivity celebration
    if (analytics.completionRate >= 80 && analytics.completed >= 3) {
      updates.push({
        type: 'notification',
        title: 'Harika İş Çıkardın! 🎉',
        message: `Bugün ${analytics.completed} görev tamamladın. %${analytics.completionRate} başarı!`,
        priority: 'low',
        autoExecute: false,
      });
    }

    return updates;
  }

  /**
   * Optimize schedules automatically
   */
  private async optimizeSchedules(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    const { updateResponsibility } = useResponsibilitiesStore.getState();
    const now = new Date();

    // Find conflicts
    const active = responsibilities
      .filter(r => r.status === 'active' && r.schedule?.datetime)
      .sort((a, b) => a.schedule!.datetime.getTime() - b.schedule!.datetime.getTime());

    // Auto-resolve conflicts by moving non-critical tasks
    for (let i = 0; i < active.length - 1; i++) {
      const current = active[i];
      const next = active[i + 1];

      if (!current.schedule?.datetime || !next.schedule?.datetime) continue;

      const currentEnd = new Date(current.schedule.datetime.getTime() + 60 * 60 * 1000);
      
      if (next.schedule.datetime < currentEnd && 
          next.reminderStyle !== 'critical' &&
          current.reminderStyle === 'critical') {
        // Move next task 1 hour later
        const newTime = new Date(currentEnd.getTime() + 30 * 60 * 1000);
        
        await updateResponsibility(next.id, {
          schedule: {
            ...next.schedule,
            datetime: newTime,
          },
        });

        updates.push({
          type: 'optimization',
          title: 'Zamanlama Optimize Edildi',
          message: `"${next.title}" çakışmayı önlemek için ${format(newTime, 'HH:mm')} saatine taşındı.`,
          priority: 'low',
          autoExecute: true,
        });
      }
    }

    return updates;
  }

  /**
   * Intelligently update lists based on patterns
   */
  private async updateListsIntelligently(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const { lists, loadLists, addList, updateList } = useListsStore.getState();
    const responsibilities = useResponsibilitiesStore.getState().responsibilities;
    await loadLists();

    // Find shopping-related responsibilities
    const shoppingTasks = responsibilities.filter(r => 
      r.category === 'shopping' || 
      r.category === 'market' || 
      r.category === 'grocery' ||
      (r.title?.toLowerCase().includes('al') || r.title?.toLowerCase().includes('buy'))
    );

    // Auto-create shopping list from shopping tasks
    if (shoppingTasks.length > 0) {
      const shoppingList = lists.find(l => 
        l.name.toLowerCase().includes('shopping') || 
        l.name.toLowerCase().includes('market') ||
        l.name.toLowerCase().includes('alışveriş')
      );

      const itemsToAdd: string[] = [];
      shoppingTasks.forEach(task => {
        // Extract items from title (simple extraction)
        const title = task.title.toLowerCase();
        if (title.includes('ekmek')) itemsToAdd.push('Ekmek');
        if (title.includes('süt')) itemsToAdd.push('Süt');
        if (title.includes('yumurta')) itemsToAdd.push('Yumurta');
        if (title.includes('milk')) itemsToAdd.push('Milk');
        if (title.includes('bread')) itemsToAdd.push('Bread');
        if (title.includes('egg')) itemsToAdd.push('Eggs');
      });

      if (itemsToAdd.length > 0) {
        if (shoppingList) {
          const newItems = itemsToAdd
            .filter(item => !shoppingList.items.some(i => i.label.toLowerCase() === item.toLowerCase()))
            .map(item => ({
              id: `auto-${Date.now()}-${Math.random()}`,
              label: item,
              category: '',
              checked: false,
              createdAt: new Date(),
            }));

          if (newItems.length > 0) {
            await updateList(shoppingList.id, {
              items: [...shoppingList.items, ...newItems],
            });

            updates.push({
              type: 'update',
              title: 'Alışveriş Listesi Güncellendi',
              message: `${newItems.length} öğe alışveriş listesine eklendi.`,
              priority: 'low',
              autoExecute: true,
            });
          }
        }
      }
    }

    return updates;
  }

  /**
   * Suggest improvements based on analytics
   */
  private async suggestImprovements(): Promise<DynamicUpdate[]> {
    const updates: DynamicUpdate[] = [];
    const analytics = analyticsService.getTodayStats();
    const weeklyReport = analyticsService.getWeeklyReport();

    // Suggestion 1: Low completion rate
    if (analytics.completionRate < 50 && analytics.total > 3) {
      updates.push({
        type: 'suggestion',
        title: 'Öneri: Görevleri Küçült',
        message: 'Tamamlama oranın düşük. Görevleri daha küçük parçalara bölmeyi dene.',
        priority: 'medium',
        autoExecute: false,
      });
    }

    // Suggestion 2: Energy balance
    if (weeklyReport.energyDistribution.high > weeklyReport.energyDistribution.low * 3) {
      updates.push({
        type: 'suggestion',
        title: 'Öneri: Enerji Dengesi',
        message: 'Çok fazla yüksek enerji görevi var. Düşük enerji görevleri ekle.',
        priority: 'low',
        autoExecute: false,
      });
    }

    // Suggestion 3: Most productive time
    if (weeklyReport.mostProductiveHour) {
      updates.push({
        type: 'suggestion',
        title: 'En Verimli Saatin',
        message: `En çok ${weeklyReport.mostProductiveHour}:00 civarında üretkensin. Önemli görevleri bu saatte planla.`,
        priority: 'low',
        autoExecute: false,
      });
    }

    return updates;
  }

  /**
   * Get all proactive actions from proactive help service
   */
  async getProactiveActions(): Promise<ProactiveAction[]> {
    return await proactiveHelpService.getSuggestions();
  }

  /**
   * Get dynamic updates for UI
   */
  async getDynamicUpdates(): Promise<DynamicUpdate[]> {
    return await this.analyzeAndUpdate();
  }
}

export const dynamicAssistantService = new DynamicAssistantService();

