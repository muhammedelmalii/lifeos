import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { analyzeResponsibilities, suggestReschedule, AnalysisResult } from './aiAnalysis';
import { format } from 'date-fns';
import { smartAutomationService } from './smartAutomation';

/**
 * Background automation service
 * Runs periodic analysis and provides proactive suggestions
 */
export class AutomationService {
  private analysisInterval: NodeJS.Timeout | null = null;
  private lastAnalysis: AnalysisResult | null = null;

  /**
   * Start periodic analysis
   */
  start(intervalMinutes: number = 30) {
    if (this.analysisInterval) {
      this.stop();
    }

    // Run immediately
    this.runAnalysis();

    // Then run periodically
    this.analysisInterval = setInterval(() => {
      this.runAnalysis();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic analysis
   */
  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  /**
   * Run analysis and process suggestions
   */
  private async runAnalysis() {
    try {
      const responsibilities = useResponsibilitiesStore.getState().responsibilities;
      const analysis = await analyzeResponsibilities(responsibilities);
      
      this.lastAnalysis = analysis;
      
      // Process high-priority suggestions automatically
      const highPrioritySuggestions = analysis.suggestions.filter(s => s.priority === 'high');
      
      for (const suggestion of highPrioritySuggestions) {
        await this.processSuggestion(suggestion, responsibilities);
      }

      // Log insights for user
      if (analysis.insights.length > 0) {
        console.log('📊 Insights:', analysis.insights);
      }
    } catch (error) {
      console.error('Automation analysis error:', error);
    }
  }

  /**
   * Process a suggestion automatically
   */
  private async processSuggestion(
    suggestion: any,
    responsibilities: Responsibility[]
  ) {
    switch (suggestion.type) {
      case 'reschedule':
        // Auto-reschedule conflicting tasks
        await this.autoRescheduleConflicts(responsibilities);
        break;
      
      case 'energy':
        // Suggest rescheduling energy-mismatched tasks
        await this.suggestEnergyReschedule(responsibilities);
        break;
      
      default:
        // Other suggestions require user input
        break;
    }
  }

  /**
   * Auto-categorize a responsibility
   */
  async autoCategorize(responsibility: Responsibility): Promise<void> {
    await smartAutomationService.autoCategorize(responsibility);
  }

  /**
   * Suggest optimal time for a responsibility
   */
  async suggestOptimalTime(responsibility: Responsibility): Promise<void> {
    const suggested = await smartAutomationService.suggestOptimalTime(responsibility);
    if (suggested) {
      console.log(`💡 Suggested optimal time for "${responsibility.title}": ${format(suggested, 'PPp')}`);
    }
  }

  /**
   * Learn from completion
   */
  async learnFromCompletion(responsibility: Responsibility): Promise<void> {
    await smartAutomationService.learnFromCompletion(responsibility);
  }

  /**
   * Learn from missed
   */
  async learnFromMissed(responsibility: Responsibility): Promise<void> {
    await smartAutomationService.learnFromMissed(responsibility);
  }

  /**
   * Suggest next steps
   */
  async suggestNextSteps(): Promise<void> {
    const suggestions = await smartAutomationService.suggestNextSteps();
    if (suggestions.length > 0) {
      console.log('💡 Next step suggestions:', suggestions);
    }
  }

  /**
   * Suggest reschedule for missed
   */
  async suggestRescheduleForMissed(responsibility: Responsibility): Promise<void> {
    const suggested = await smartAutomationService.suggestRescheduleForMissed(responsibility);
    if (suggested) {
      console.log(`💡 Suggested reschedule for missed "${responsibility.title}": ${format(suggested, 'PPp')}`);
    }
  }

  /**
   * Check for conflicts
   */
  async checkConflicts(): Promise<void> {
    const suggestions = await smartAutomationService.checkConflicts();
    if (suggestions.length > 0) {
      console.log('⚠️ Conflicts detected:', suggestions);
    }
  }

  /**
   * Run analysis (public method)
   */
  async runAnalysisPublic(): Promise<void> {
    await this.runAnalysis();
  }

  /**
   * Auto-reschedule conflicting responsibilities
   */
  private async autoRescheduleConflicts(responsibilities: Responsibility[]) {
    const now = new Date();
    const active = responsibilities.filter(r => r.status === 'active');
    
    // Find conflicts
    const conflicts: Responsibility[][] = [];
    const sorted = [...active].sort((a, b) => 
      a.schedule.datetime.getTime() - b.schedule.datetime.getTime()
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      const currentEnd = new Date(current.schedule.datetime.getTime() + 60 * 60 * 1000);
      if (next.schedule.datetime < currentEnd) {
        conflicts.push([current, next]);
      }
    }

    // Reschedule second task in each conflict
    for (const [first, second] of conflicts) {
      const suggested = suggestReschedule(second, responsibilities);
      if (suggested) {
        // Only auto-reschedule if it's not critical
        if (second.reminderStyle !== 'critical') {
          await useResponsibilitiesStore.getState().updateResponsibility(second.id, {
            schedule: {
              ...second.schedule,
              datetime: suggested,
            },
          });
          
          console.log(`🔄 Auto-rescheduled: ${second.title} to ${format(suggested, 'PPp')}`);
        }
      }
    }
  }

  /**
   * Suggest rescheduling for energy-mismatched tasks
   */
  private async suggestEnergyReschedule(responsibilities: Responsibility[]) {
    const now = new Date();
    const currentHour = now.getHours();
    const isLowEnergyTime = currentHour >= 22 || currentHour <= 6;
    
    const mismatched = responsibilities.filter(r => {
      if (r.status !== 'active') return false;
      if (r.schedule.datetime < now) return false;
      if (r.schedule.datetime > new Date(now.getTime() + 24 * 60 * 60 * 1000)) return false;
      
      return isLowEnergyTime && r.energyRequired === 'high';
    });

    for (const task of mismatched) {
      const suggested = suggestReschedule(task, responsibilities);
      if (suggested) {
        // Store suggestion for user to approve
        console.log(`💡 Suggestion: Reschedule "${task.title}" to ${format(suggested, 'PPp')} for better energy match`);
      }
    }
  }

  /**
   * Get last analysis results
   */
  getLastAnalysis(): AnalysisResult | null {
    return this.lastAnalysis;
  }
}

// Singleton instance
export const automationService = new AutomationService();

