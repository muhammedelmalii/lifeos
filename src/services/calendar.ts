import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { Responsibility } from '@/types';

export const requestCalendarPermissions = async (): Promise<boolean> => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
};

export const getCalendars = async (): Promise<Calendar.Calendar[]> => {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  if (status !== 'granted') {
    return [];
  }
  return await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
};

export const createCalendarEvent = async (
  responsibility: Responsibility,
  calendarId?: string
): Promise<string | null> => {
  try {
    // Check permissions first
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) {
      console.warn('Calendar permissions not granted');
      return null;
    }

    const calendars = await getCalendars();
    if (calendars.length === 0) {
      console.warn('No calendars available');
      return null;
    }

    const targetCalendar = calendarId
      ? calendars.find((c) => c.id === calendarId)
      : calendars[0];

    if (!targetCalendar) {
      console.warn('Target calendar not found');
      return null;
    }

    // Ensure datetime is a Date object
    const startDate = responsibility.schedule.datetime instanceof Date
      ? responsibility.schedule.datetime
      : new Date(responsibility.schedule.datetime);

    // Calculate end date (default 1 hour, or based on energy level)
    const durationHours = responsibility.energyRequired === 'high' ? 2 : 
                         responsibility.energyRequired === 'low' ? 0.5 : 1;
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);

    const eventId = await Calendar.createEventAsync(targetCalendar.id, {
      title: responsibility.title,
      notes: responsibility.description || '',
      startDate: startDate,
      endDate: endDate,
      timeZone: responsibility.schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      alarms: responsibility.escalationRules && responsibility.escalationRules.length > 0
        ? responsibility.escalationRules.map((rule) => ({
            relativeOffset: -rule.offsetMinutes,
            method: Calendar.AlarmMethod.ALERT,
          }))
        : [{
            relativeOffset: -15, // Default 15 minutes before
            method: Calendar.AlarmMethod.ALERT,
          }],
    });

    console.log('Calendar event created:', eventId);
    return eventId;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return null;
  }
};

export const updateCalendarEvent = async (
  eventId: string,
  responsibility: Responsibility
): Promise<string | null> => {
  try {
    // Note: expo-calendar doesn't have a direct update method
    // So we delete the old event and create a new one
    await deleteCalendarEvent(eventId);
    
    // Recreate with new data
    return await createCalendarEvent(responsibility);
  } catch (error) {
    console.error('Failed to update calendar event:', error);
    return null;
  }
};

export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch (error) {
    console.error('Failed to delete calendar event:', error);
  }
};

/**
 * Get calendar events for a date range
 * This allows the app to show existing calendar appointments
 */
export const getCalendarEvents = async (
  startDate: Date,
  endDate: Date
): Promise<Calendar.Event[]> => {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    if (status !== 'granted') {
      return [];
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    if (calendars.length === 0) {
      return [];
    }

    const allEvents: Calendar.Event[] = [];
    
    for (const cal of calendars) {
      try {
        const events = await Calendar.getEventsAsync(
          [cal.id],
          startDate,
          endDate
        );
        allEvents.push(...events);
      } catch (error) {
        console.error(`Failed to get events from calendar ${cal.title}:`, error);
      }
    }

    return allEvents.sort((a, b) => 
      (a.startDate?.getTime() || 0) - (b.startDate?.getTime() || 0)
    );
  } catch (error) {
    console.error('Failed to get calendar events:', error);
    return [];
  }
};

/**
 * Get upcoming calendar events (next 7 days)
 */
export const getUpcomingCalendarEvents = async (): Promise<Calendar.Event[]> => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return getCalendarEvents(now, nextWeek);
};

