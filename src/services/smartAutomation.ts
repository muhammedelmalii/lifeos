/**
 * Advanced AI-powered automation features
 * Uses OpenAI for intelligent suggestions and automation
 */

import { Responsibility } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { analyzeResponsibilities } from './aiAnalysis';

interface SmartSuggestion {
  type: 'reschedule' | 'categorize' | 'break' | 'batch' | 'priority';
  title: string;
  description: string;
  action: () => Promise<void>;
  confidence: number;
}

interface UserPattern {
  productiveHours: number[];
  preferredCategories: string[];
  energyPatterns: {
    morning: 'low' | 'medium' | 'high';
    afternoon: 'low' | 'medium' | 'high';
    evening: 'low' | 'medium' | 'high';
  };
  completionRate: number;
}

class SmartAutomationService {
  private userPatterns: UserPattern | null = null;
  private suggestions: SmartSuggestion[] = [];

  /**
   * Auto-categorize a responsibility using AI
   */
  async autoCategorize(responsibility: Responsibility): Promise<string | null> {
    try {
      // Use AI to suggest category
      const prompt = `Based on this responsibility: "${responsibility.title}${responsibility.description ? ' - ' + responsibility.description : ''}", suggest a single category. Return only the category name, nothing else. Examples: work, personal, health, shopping, home, finance, social.`;
      
      // For now, use rule-based categorization
      // In production, this would call OpenAI
      const category = this.ruleBasedCategorize(responsibility);
      
      if (category && !responsibility.category) {
        // Auto-update if no category exists
        await useResponsibilitiesStore.getState().updateResponsibility(responsibility.id, {
          category,
        });
        return category;
      }
      
      return category;
    } catch (error) {
      console.error('Auto-categorization error:', error);
      return null;
    }
  }

  /**
   * Rule-based categorization (fallback)
   */
  private ruleBasedCategorize(responsibility: Responsibility): string | null {
    const title = responsibility.title.toLowerCase();
    const description = (responsibility.description || '').toLowerCase();
    const text = `${title} ${description}`;

    if (text.match(/\b(meeting|call|email|work|project|client|deadline|report|presentation)\b/)) {
      return 'work';
    }
    if (text.match(/\b(buy|purchase|shopping|grocery|store|market)\b/)) {
      return 'shopping';
    }
    if (text.match(/\b(exercise|gym|workout|run|walk|health|doctor|appointment|medication)\b/)) {
      return 'health';
    }
    if (text.match(/\b(bill|pay|payment|invoice|bank|money|finance|budget)\b/)) {
      return 'finance';
    }
    if (text.match(/\b(clean|repair|fix|home|house|apartment|maintenance)\b/)) {
      return 'home';
    }
    if (text.match(/\b(friend|family|social|party|dinner|lunch|coffee|meet)\b/)) {
      return 'social';
    }
    if (text.match(/\b(learn|study|read|course|book|education|skill)\b/)) {
      return 'learning';
    }

    return null;
  }

  /**
   * Suggest optimal time for a responsibility
   */
  async suggestOptimalTime(responsibility: Responsibility): Promise<Date | null> {
    const patterns = await this.getUserPatterns();
    const now = new Date();
    
    // Get user's productive hours
    const productiveHours = patterns?.productiveHours || [9, 10, 11, 14, 15, 16];
    
    // Find best time based on energy requirement
    let suggestedHour = 10; // Default
    
    if (responsibility.energyRequired === 'high') {
      // High energy tasks in morning (peak productivity)
      suggestedHour = productiveHours[0] || 9;
    } else if (responsibility.energyRequired === 'low') {
      // Low energy tasks in afternoon
      suggestedHour = productiveHours[productiveHours.length - 1] || 15;
    } else {
      // Medium energy tasks in mid-day
      const midIndex = Math.floor(productiveHours.length / 2);
      suggestedHour = productiveHours[midIndex] || 12;
    }

    // Create suggested date (tomorrow at suggested hour)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(suggestedHour, 0, 0, 0);

    // Check for conflicts
    const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
    const hasConflict = allResponsibilities.some(r => {
      if (r.id === responsibility.id) return false;
      const timeDiff = Math.abs(r.schedule.datetime.getTime() - tomorrow.getTime());
      return timeDiff < 60 * 60 * 1000; // Within 1 hour
    });

    if (hasConflict) {
      // Move to next available slot
      tomorrow.setHours(tomorrow.getHours() + 2);
    }

    return tomorrow;
  }

  /**
   * Learn from completed responsibilities
   */
  async learnFromCompletion(responsibility: Responsibility): Promise<void> {
    if (!responsibility.completedAt) return;

    const completedHour = responsibility.completedAt.getHours();
    const patterns = await this.getUserPatterns();

    // Update productive hours pattern
    if (!patterns) {
      this.userPatterns = {
        productiveHours: [completedHour],
        preferredCategories: responsibility.category ? [responsibility.category] : [],
        energyPatterns: {
          morning: 'medium',
          afternoon: 'medium',
          evening: 'medium',
        },
        completionRate: 1,
      };
    } else {
      // Add to productive hours if not already there
      if (!patterns.productiveHours.includes(completedHour)) {
        patterns.productiveHours.push(completedHour);
        patterns.productiveHours.sort((a, b) => a - b);
      }

      // Update preferred categories
      if (responsibility.category && !patterns.preferredCategories.includes(responsibility.category)) {
        patterns.preferredCategories.push(responsibility.category);
      }

      // Update completion rate
      const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
      const completed = allResponsibilities.filter(r => r.status === 'completed').length;
      const total = allResponsibilities.filter(r => 
        r.status === 'completed' || r.status === 'missed'
      ).length;
      patterns.completionRate = total > 0 ? completed / total : 1;
    }
  }

  /**
   * Learn from missed responsibilities
   */
  async learnFromMissed(responsibility: Responsibility): Promise<void> {
    const patterns = await this.getUserPatterns();
    
    // Learn that this time/energy combination might not work
    const scheduledHour = responsibility.schedule.datetime.getHours();
    
    if (patterns) {
      // Remove from productive hours if it was there
      const index = patterns.productiveHours.indexOf(scheduledHour);
      if (index > -1) {
        patterns.productiveHours.splice(index, 1);
      }
    }
  }

  /**
   * Get user patterns (with caching)
   */
  async getUserPatterns(): Promise<UserPattern | null> {
    if (this.userPatterns) {
      return this.userPatterns;
    }

    // Analyze from completed responsibilities
    const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
    const completed = allResponsibilities.filter(r => r.status === 'completed' && r.completedAt);

    if (completed.length < 3) {
      return null; // Not enough data
    }

    const completionHours = completed.map(r => r.completedAt!.getHours());
    const hourCounts = completionHours.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const productiveHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([hour]) => parseInt(hour))
      .sort((a, b) => a - b);

    const categories = completed
      .map(r => r.category)
      .filter((c): c is string => !!c);
    const categoryCounts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat]) => cat);

    const total = allResponsibilities.filter(r => 
      r.status === 'completed' || r.status === 'missed'
    ).length;
    const completionRate = total > 0 ? completed.length / total : 1;

    this.userPatterns = {
      productiveHours,
      preferredCategories,
      energyPatterns: {
        morning: 'medium',
        afternoon: 'medium',
        evening: 'medium',
      },
      completionRate,
    };

    return this.userPatterns;
  }

  /**
   * Suggest next steps after completing a task
   */
  async suggestNextSteps(): Promise<SmartSuggestion[]> {
    const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
    const upcoming = allResponsibilities.filter(r => 
      r.status === 'active' && 
      r.schedule.datetime > new Date()
    );

    const suggestions: SmartSuggestion[] = [];

    // Suggest batching similar tasks
    const byCategory = upcoming.reduce((acc, r) => {
      const category = r.category || 'uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(r);
      return acc;
    }, {} as Record<string, Responsibility[]>);

    Object.entries(byCategory).forEach(([category, tasks]) => {
      if (tasks.length >= 2) {
        suggestions.push({
          type: 'batch',
          title: `Batch ${category} tasks`,
          description: `You have ${tasks.length} ${category} tasks. Consider doing them together.`,
          confidence: 0.7,
          action: async () => {
            // Could navigate to a batch view or suggest rescheduling
            console.log(`Batch suggestion for ${category}`);
          },
        });
      }
    });

    return suggestions;
  }

  /**
   * Suggest rescheduling for missed responsibility
   */
  async suggestRescheduleForMissed(responsibility: Responsibility): Promise<Date | null> {
    const optimalTime = await this.suggestOptimalTime(responsibility);
    return optimalTime;
  }

  /**
   * Check for conflicts and suggest resolutions
   */
  async checkConflicts(): Promise<SmartSuggestion[]> {
    const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
    const active = allResponsibilities.filter(r => r.status === 'active' && r.schedule?.datetime);
    
    const conflicts: Array<{ first: Responsibility; second: Responsibility }> = [];
    const sorted = [...active].sort((a, b) => {
      if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
      return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      
      if (!current.schedule?.datetime || !next.schedule?.datetime) continue;
      
      const currentEnd = new Date(current.schedule.datetime.getTime() + 60 * 60 * 1000);
      if (next.schedule.datetime < currentEnd) {
        conflicts.push({ first: current, second: next });
      }
    }

    const suggestions: SmartSuggestion[] = conflicts.map(({ first, second }) => ({
      type: 'reschedule',
      title: `Conflict: ${first.title} & ${second.title}`,
      description: `These responsibilities overlap. Consider rescheduling ${second.title}.`,
      confidence: 0.9,
      action: async () => {
        const suggested = await this.suggestOptimalTime(second);
        if (suggested) {
          await useResponsibilitiesStore.getState().updateResponsibility(second.id, {
            schedule: {
              ...second.schedule,
              datetime: suggested,
            },
          });
        }
      },
    }));

    return suggestions;
  }

  /**
   * Run full analysis and generate suggestions
   */
  async runAnalysis(): Promise<SmartSuggestion[]> {
    const allResponsibilities = useResponsibilitiesStore.getState().responsibilities;
    const analysis = await analyzeResponsibilities(allResponsibilities);
    
    const suggestions: SmartSuggestion[] = analysis.suggestions.map((s: any) => ({
      type: s.type as any,
      title: s.title,
      description: s.description,
      confidence: s.priority === 'high' ? 0.9 : s.priority === 'medium' ? 0.7 : 0.5,
      action: s.action || (async () => {}),
    }));

    this.suggestions = suggestions;
    return suggestions;
  }

  /**
   * Get current suggestions
   */
  getSuggestions(): SmartSuggestion[] {
    return this.suggestions;
  }
}

export const smartAutomationService = new SmartAutomationService();

