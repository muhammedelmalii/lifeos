import { Responsibility, EnergyLevel } from '@/types';
import { format, isAfter, isBefore, addDays, startOfDay, getHours } from 'date-fns';

export interface AnalysisResult {
  suggestions: Suggestion[];
  patterns: Pattern[];
  insights: Insight[];
}

export interface Suggestion {
  type: 'reschedule' | 'energy' | 'priority' | 'break' | 'batch';
  title: string;
  description: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}

export interface Pattern {
  type: 'time' | 'energy' | 'completion' | 'missed';
  description: string;
  confidence: number;
}

export interface Insight {
  type: 'productivity' | 'balance' | 'trend';
  title: string;
  description: string;
  metric?: string;
}

/**
 * Analyze user's responsibilities and provide intelligent suggestions
 */
export const analyzeResponsibilities = async (
  responsibilities: Responsibility[]
): Promise<AnalysisResult> => {
  const suggestions: Suggestion[] = [];
  const patterns: Pattern[] = [];
  const insights: Insight[] = [];

  const now = new Date();
  const active = responsibilities.filter(r => r.status === 'active');
  const completed = responsibilities.filter(r => r.status === 'completed');
  const missed = responsibilities.filter(r => r.status === 'missed');

  // 1. Time-based analysis
  const timePattern = analyzeTimePatterns(active);
  if (timePattern) patterns.push(timePattern);

  // 2. Energy distribution analysis
  const energyInsight = analyzeEnergyDistribution(active);
  if (energyInsight) insights.push(energyInsight);

  // 3. Conflict detection
  const conflicts = detectConflicts(active);
  if (conflicts.length > 0) {
    suggestions.push({
      type: 'reschedule',
      title: 'Schedule Conflicts Detected',
      description: `You have ${conflicts.length} responsibilities scheduled at overlapping times. Consider rescheduling.`,
      priority: 'high',
    });
  }

  // 4. Energy matching suggestions
  const energySuggestions = suggestEnergyMatching(active, now);
  suggestions.push(...energySuggestions);

  // 5. Break suggestions
  const breakSuggestion = suggestBreaks(active, now);
  if (breakSuggestion) suggestions.push(breakSuggestion);

  // 6. Batch processing suggestions
  const batchSuggestions = suggestBatching(active);
  suggestions.push(...batchSuggestions);

  // 7. Productivity insights
  const productivityInsight = analyzeProductivity(completed, missed);
  if (productivityInsight) insights.push(productivityInsight);

  // 8. Balance insights
  const balanceInsight = analyzeBalance(active);
  if (balanceInsight) insights.push(balanceInsight);

  return {
    suggestions: suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    patterns,
    insights,
  };
};

/**
 * Analyze time patterns (when user is most productive)
 */
const analyzeTimePatterns = (responsibilities: Responsibility[]): Pattern | null => {
  if (responsibilities.length < 5) return null;

  const completionHours: number[] = [];
  responsibilities.forEach(r => {
    if (r.completedAt) {
      completionHours.push(getHours(r.completedAt));
    }
  });

  if (completionHours.length < 3) return null;

  // Find most common completion hour
  const hourCounts = completionHours.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const peakHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  if (peakHour && (peakHour[1] as number) >= 3) {
    const count = peakHour[1] as number;
    return {
      type: 'time',
      description: `You're most productive around ${peakHour[0]}:00`,
      confidence: parseFloat((count / completionHours.length).toFixed(2)),
    };
  }

  return null;
};

/**
 * Analyze energy distribution
 */
const analyzeEnergyDistribution = (responsibilities: Responsibility[]): Insight | null => {
  if (responsibilities.length === 0) return null;

  const energyCounts = responsibilities.reduce((acc, r) => {
    acc[r.energyRequired] = (acc[r.energyRequired] || 0) + 1;
    return acc;
  }, {} as Record<EnergyLevel, number>);

  const total = responsibilities.length;
  const highEnergyPercent = ((energyCounts.high || 0) / total) * 100;

  if (highEnergyPercent > 60) {
    return {
      type: 'balance',
      title: 'High Energy Load',
      description: `${Math.round(highEnergyPercent)}% of your responsibilities require high energy. Consider balancing with low-energy tasks.`,
      metric: `${Math.round(highEnergyPercent)}%`,
    };
  }

  return null;
};

/**
 * Detect scheduling conflicts
 */
const detectConflicts = (responsibilities: Responsibility[]): Responsibility[][] => {
  const conflicts: Responsibility[][] = [];
  const sorted = [...responsibilities].sort((a, b) => 
    a.schedule.datetime.getTime() - b.schedule.datetime.getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    const currentEnd = new Date(current.schedule.datetime.getTime() + 60 * 60 * 1000); // Assume 1 hour
    if (isBefore(next.schedule.datetime, currentEnd)) {
      conflicts.push([current, next]);
    }
  }

  return conflicts;
};

/**
 * Suggest energy matching (low energy tasks when energy is low)
 */
const suggestEnergyMatching = (
  responsibilities: Responsibility[],
  now: Date
): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  const currentHour = getHours(now);
  
  // Low energy times (late night, early morning)
  const isLowEnergyTime = currentHour >= 22 || currentHour <= 6;
  
  const highEnergyTasks = responsibilities.filter(
    r => r.energyRequired === 'high' && 
    isAfter(r.schedule.datetime, now) &&
    isBefore(r.schedule.datetime, addDays(now, 1))
  );

  if (isLowEnergyTime && highEnergyTasks.length > 0) {
    suggestions.push({
      type: 'energy',
      title: 'Energy Mismatch',
      description: `You have ${highEnergyTasks.length} high-energy tasks scheduled, but it's a low-energy time. Consider rescheduling.`,
      priority: 'medium',
    });
  }

  return suggestions;
};

/**
 * Suggest breaks between tasks
 */
const suggestBreaks = (
  responsibilities: Responsibility[],
  now: Date
): Suggestion | null => {
  const next24Hours = responsibilities
    .filter(r => 
      isAfter(r.schedule.datetime, now) &&
      isBefore(r.schedule.datetime, addDays(now, 1))
    )
    .sort((a, b) => a.schedule.datetime.getTime() - b.schedule.datetime.getTime());

  if (next24Hours.length < 3) return null;

  // Check for back-to-back tasks
  let hasBackToBack = false;
  for (let i = 0; i < next24Hours.length - 1; i++) {
    const gap = next24Hours[i + 1].schedule.datetime.getTime() - 
                next24Hours[i].schedule.datetime.getTime();
    if (gap < 30 * 60 * 1000) { // Less than 30 minutes
      hasBackToBack = true;
      break;
    }
  }

  if (hasBackToBack) {
    return {
      type: 'break',
      title: 'Take a Break',
      description: 'You have back-to-back responsibilities. Consider scheduling breaks to maintain focus.',
      priority: 'medium',
    };
  }

  return null;
};

/**
 * Suggest batching similar tasks
 */
const suggestBatching = (responsibilities: Responsibility[]): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  
  // Group by category
  const byCategory = responsibilities.reduce((acc, r) => {
    const category = r.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(r);
    return acc;
  }, {} as Record<string, Responsibility[]>);

  Object.entries(byCategory).forEach(([category, tasks]) => {
    if (tasks.length >= 3) {
      suggestions.push({
        type: 'batch',
        title: `Batch ${category} Tasks`,
        description: `You have ${tasks.length} ${category} tasks. Consider grouping them together for efficiency.`,
        priority: 'low',
      });
    }
  });

  return suggestions;
};

/**
 * Analyze productivity trends
 */
const analyzeProductivity = (
  completed: Responsibility[],
  missed: Responsibility[]
): Insight | null => {
  const total = completed.length + missed.length;
  if (total === 0) return null;

  const completionRate = (completed.length / total) * 100;

  if (completionRate >= 80) {
    return {
      type: 'productivity',
      title: 'Great Progress!',
      description: `You've completed ${Math.round(completionRate)}% of your responsibilities. Keep it up!`,
      metric: `${Math.round(completionRate)}%`,
    };
  } else if (completionRate < 50) {
    return {
      type: 'productivity',
      title: 'Room for Improvement',
      description: `Completion rate is ${Math.round(completionRate)}%. Consider adjusting your schedule or breaking tasks into smaller steps.`,
      metric: `${Math.round(completionRate)}%`,
    };
  }

  return null;
};

/**
 * Analyze work-life balance
 */
const analyzeBalance = (responsibilities: Responsibility[]): Insight | null => {
  if (responsibilities.length === 0) return null;

  const workTasks = responsibilities.filter(r => 
    r.category?.toLowerCase().includes('work') || 
    r.category?.toLowerCase().includes('business')
  );
  const personalTasks = responsibilities.filter(r => 
    !r.category?.toLowerCase().includes('work') &&
    !r.category?.toLowerCase().includes('business')
  );

  const workPercent = (workTasks.length / responsibilities.length) * 100;

  if (workPercent > 70) {
    return {
      type: 'balance',
      title: 'Work-Life Balance',
      description: `${Math.round(workPercent)}% of your responsibilities are work-related. Consider adding more personal time.`,
      metric: `${Math.round(workPercent)}%`,
    };
  }

  return null;
};

/**
 * Smart reschedule suggestion based on patterns
 */
export const suggestReschedule = (
  responsibility: Responsibility,
  allResponsibilities: Responsibility[]
): Date | null => {
  // Find best time slot based on:
  // 1. User's productive hours (from patterns)
  // 2. Energy level matching
  // 3. Avoiding conflicts

  const now = new Date();
  const tomorrow = addDays(startOfDay(now), 1);
  
  // Default: tomorrow at 10 AM (peak productivity assumption)
  const suggested = new Date(tomorrow);
  suggested.setHours(10, 0, 0, 0);

  // Adjust based on energy requirement
  if (responsibility.energyRequired === 'high') {
    suggested.setHours(9, 0, 0, 0); // Morning for high energy
  } else if (responsibility.energyRequired === 'low') {
    suggested.setHours(14, 0, 0, 0); // Afternoon for low energy
  }

  // Check for conflicts
  const hasConflict = allResponsibilities.some(r => {
    if (r.id === responsibility.id) return false;
    const timeDiff = Math.abs(r.schedule.datetime.getTime() - suggested.getTime());
    return timeDiff < 60 * 60 * 1000; // Within 1 hour
  });

  if (hasConflict) {
    // Move to next available slot
    suggested.setHours(suggested.getHours() + 2);
  }

  return suggested;
};

