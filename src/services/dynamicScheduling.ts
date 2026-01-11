/**
 * Dynamic Scheduling Service
 * Intelligently schedules recurring tasks based on calendar availability
 * Example: "Haftada 3 gün spor" → finds 3 best days in the week
 */

import { Responsibility, Schedule } from '@/types';
import { useResponsibilitiesStore } from '@/store/responsibilities';
import { getCalendarEvents, requestCalendarPermissions } from './calendar';
import * as Calendar from 'expo-calendar';
import { 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  addWeeks,
  startOfDay,
  isBefore,
  isAfter,
  differenceInHours,
  eachDayOfInterval,
  format as formatDate,
} from 'date-fns';
import { RRule } from 'rrule';

export interface SchedulingOptions {
  frequency: 'weekly' | 'daily' | 'monthly';
  count?: number; // e.g., 3 for "haftada 3 gün"
  preferredTimes?: string[]; // e.g., ['morning', 'evening']
  durationMinutes?: number; // e.g., 60 for 1 hour workout
  energyLevel?: 'low' | 'medium' | 'high';
  avoidDays?: string[]; // e.g., ['Monday', 'Wednesday'] - working days
}

export interface ScheduledSlot {
  date: Date;
  startTime: Date;
  endTime: Date;
  score: number; // Higher = better slot
  reason?: string;
}

/**
 * Find optimal slots for a recurring task
 * Example: "Haftada 3 gün spor yapmak istiyorum"
 */
export const findOptimalSlots = async (
  options: SchedulingOptions,
  workSchedule?: WorkDay[] // Optional: working days/night shifts
): Promise<ScheduledSlot[]> => {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  // Get calendar events for the week
  const hasPermission = await requestCalendarPermissions();
  let calendarEvents: Calendar.Event[] = [];
  if (hasPermission) {
    try {
      calendarEvents = await getCalendarEvents(weekStart, weekEnd);
    } catch (error) {
      console.error('Failed to get calendar events:', error);
    }
  }

  // Get existing responsibilities
  const { responsibilities } = useResponsibilitiesStore.getState();
  const activeTasks = responsibilities.filter(r => 
    r.status === 'active' && 
    r.schedule &&
    r.schedule.datetime >= weekStart &&
    r.schedule.datetime <= weekEnd
  );

  // Generate all possible slots in the week
  const allDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const slots: ScheduledSlot[] = [];

  for (const day of allDays) {
    // Skip avoided days (e.g., work days)
    const dayName = getDayName(day);
    if (options.avoidDays?.includes(dayName)) {
      continue;
    }

    // Check if this is a work day
    const isWorkDay = workSchedule?.some(wd => 
      isSameDay(wd.date, day) && wd.isWorking
    );

    // Generate time slots for this day
    const daySlots = generateDaySlots(
      day,
      options,
      calendarEvents,
      activeTasks,
      isWorkDay,
      workSchedule
    );

    slots.push(...daySlots);
  }

  // Score and sort slots
  const scoredSlots = slots.map(slot => ({
    ...slot,
    score: scoreSlot(slot, options, calendarEvents, activeTasks, workSchedule),
  }));

  // Sort by score (highest first)
  scoredSlots.sort((a, b) => b.score - a.score);

  // Return top N slots based on count
  const count = options.count || (options.frequency === 'weekly' ? 3 : 7);
  return scoredSlots.slice(0, count);
};

/**
 * Generate time slots for a specific day
 */
const generateDaySlots = (
  day: Date,
  options: SchedulingOptions,
  calendarEvents: Calendar.Event[],
  activeTasks: Responsibility[],
  isWorkDay: boolean,
  workSchedule?: WorkDay[]
): ScheduledSlot[] => {
  const slots: ScheduledSlot[] = [];
  const duration = options.durationMinutes || 60;
  
  // Default time slots based on energy level and preferences
  const preferredTimes = options.preferredTimes || 
    (options.energyLevel === 'high' ? ['morning'] : ['morning', 'evening']);

  // If it's a work day, prefer evening slots
  if (isWorkDay) {
    preferredTimes.push('evening');
  }

  // Generate morning slot (8-10 AM)
  if (preferredTimes.includes('morning')) {
    const morningStart = new Date(day);
    morningStart.setHours(8, 0, 0, 0);
    const morningEnd = new Date(morningStart);
    morningEnd.setMinutes(morningEnd.getMinutes() + duration);
    
    slots.push({
      date: day,
      startTime: morningStart,
      endTime: morningEnd,
      score: 0,
    });
  }

  // Generate evening slot (6-8 PM)
  if (preferredTimes.includes('evening')) {
    const eveningStart = new Date(day);
    eveningStart.setHours(18, 0, 0, 0);
    const eveningEnd = new Date(eveningStart);
    eveningEnd.setMinutes(eveningEnd.getMinutes() + duration);
    
    slots.push({
      date: day,
      startTime: eveningStart,
      endTime: eveningEnd,
      score: 0,
    });
  }

  // Filter out slots that conflict with calendar events or existing tasks
  return slots.filter(slot => {
    // Check calendar conflicts
    const hasCalendarConflict = calendarEvents.some(event => {
      if (!event.startDate || !event.endDate) return false;
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (
        (slot.startTime >= eventStart && slot.startTime < eventEnd) ||
        (slot.endTime > eventStart && slot.endTime <= eventEnd) ||
        (slot.startTime <= eventStart && slot.endTime >= eventEnd)
      );
    });

    // Check task conflicts
    const hasTaskConflict = activeTasks.some(task => {
      if (!task.schedule?.datetime) return false;
      const taskDate = new Date(task.schedule.datetime);
      const taskDuration = task.energyRequired === 'high' ? 120 : 60;
      const taskEnd = new Date(taskDate);
      taskEnd.setMinutes(taskEnd.getMinutes() + taskDuration);
      
      return (
        (slot.startTime >= taskDate && slot.startTime < taskEnd) ||
        (slot.endTime > taskDate && slot.endTime <= taskEnd) ||
        (slot.startTime <= taskDate && slot.endTime >= taskEnd)
      );
    });

    return !hasCalendarConflict && !hasTaskConflict;
  });
};

/**
 * Score a slot based on various factors
 */
const scoreSlot = (
  slot: ScheduledSlot,
  options: SchedulingOptions,
  calendarEvents: Calendar.Event[],
  activeTasks: Responsibility[],
  workSchedule?: WorkDay[]
): number => {
  let score = 100;

  const dayOfWeek = slot.startTime.getDay();
  const hour = slot.startTime.getHours();
  const dayName = getDayName(slot.startTime);

  // Prefer weekends for high-energy activities
  if (options.energyLevel === 'high' && (dayOfWeek === 0 || dayOfWeek === 6)) {
    score += 20;
  }

  // Prefer weekdays for low-energy activities
  if (options.energyLevel === 'low' && dayOfWeek >= 1 && dayOfWeek <= 5) {
    score += 15;
  }
  
  // Check if this day is in avoidDays
  if (options.avoidDays?.includes(dayName)) {
    score -= 50; // Heavy penalty
  }

  // Prefer morning for high-energy
  if (options.energyLevel === 'high' && hour >= 7 && hour <= 10) {
    score += 25;
  }

  // Prefer evening for low-energy
  if (options.energyLevel === 'low' && hour >= 17 && hour <= 20) {
    score += 15;
  }

  // Penalize slots with nearby calendar events
  const nearbyEvents = calendarEvents.filter(event => {
    if (!event.startDate) return false;
    const eventStart = new Date(event.startDate);
    const hoursDiff = Math.abs(differenceInHours(slot.startTime, eventStart));
    return hoursDiff < 2;
  });
  score -= nearbyEvents.length * 10;

  // Penalize slots with nearby tasks
  const nearbyTasks = activeTasks.filter(task => {
    if (!task.schedule?.datetime) return false;
    const taskDate = new Date(task.schedule.datetime);
    const hoursDiff = Math.abs(differenceInHours(slot.startTime, taskDate));
    return hoursDiff < 2;
  });
  score -= nearbyTasks.length * 8;

  // Bonus for days after work days (if work schedule provided)
  if (workSchedule) {
    const isRestDay = workSchedule.some(wd => 
      isSameDay(wd.date, slot.date) && !wd.isWorking
    );
    if (isRestDay) {
      score += 30;
    }
  }

  return Math.max(0, score);
};

/**
 * Create recurring responsibilities for optimal slots
 */
export const createScheduledResponsibilities = async (
  title: string,
  description: string,
  slots: ScheduledSlot[],
  options: SchedulingOptions
): Promise<string[]> => {
  const { addResponsibility } = useResponsibilitiesStore.getState();
  const responsibilityIds: string[] = [];

  for (const slot of slots) {
    // Create RRULE for recurring pattern
    const weekdayMap = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA];
    const weekday = weekdayMap[slot.startTime.getDay()];
    
    const rrule = new RRule({
      freq: options.frequency === 'weekly' ? RRule.WEEKLY : RRule.DAILY,
      interval: 1,
      dtstart: slot.startTime,
      count: options.frequency === 'weekly' ? 12 : 30, // 12 weeks or 30 days
      byweekday: options.frequency === 'weekly' ? weekday : undefined,
    });

    const responsibility: Responsibility = {
      id: uuidv4(),
      title,
      description,
      category: options.energyLevel === 'high' ? 'exercise' : 'personal',
      energyRequired: options.energyLevel || 'medium',
      schedule: {
        type: 'recurring',
        datetime: slot.startTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        rrule: rrule.toString(),
      },
      reminderStyle: 'persistent',
      escalationRules: [
        { offsetMinutes: 60, channel: 'notification', strength: 'gentle' },
        { offsetMinutes: 15, channel: 'notification', strength: 'persistent' },
      ],
      status: 'active',
      checklist: [],
      createdFrom: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addResponsibility(responsibility);
    responsibilityIds.push(responsibility.id);

    // Schedule notifications (handled by notifications service)
    await scheduleResponsibilityNotifications(responsibility);
  }

  return responsibilityIds;
};

/**
 * Work schedule interface for shift work/night shifts
 */
export interface WorkDay {
  date: Date;
  isWorking: boolean;
  shiftType?: 'day' | 'night' | 'evening';
  startTime?: Date;
  endTime?: Date;
}

/**
 * Process work schedule (e.g., from calendar or manual input)
 */
export const processWorkSchedule = async (
  workScheduleInput: string | WorkDay[] | Calendar.Event[]
): Promise<WorkDay[]> => {
  if (Array.isArray(workScheduleInput)) {
    // Check if it's WorkDay[] or Calendar.Event[]
    if (workScheduleInput.length > 0 && 'startDate' in workScheduleInput[0]) {
      // It's Calendar.Event[]
      return (workScheduleInput as Calendar.Event[]).map(event => ({
        date: event.startDate ? new Date(event.startDate) : new Date(),
        isWorking: true,
        startTime: event.startDate ? new Date(event.startDate) : undefined,
        endTime: event.endDate ? new Date(event.endDate) : undefined,
      }));
    }
    return workScheduleInput as WorkDay[];
  }

  // Parse text input (e.g., "Pazartesi, Salı, Çarşamba çalışıyorum")
  // This is a simplified parser - in production, use AI
  const workDays: WorkDay[] = [];
  const lowerText = workScheduleInput.toLowerCase();
  const dayNames = ['pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
  
  // For now, return empty array - in production, use AI to parse
  // or provide a structured input format
  
  return workDays;
};

// Helper functions
const getDayName = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Import missing functions
import { v4 as uuidv4 } from 'uuid';
import { scheduleResponsibilityNotifications } from './notifications';

