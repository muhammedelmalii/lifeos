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
    const calendars = await getCalendars();
    if (calendars.length === 0) {
      return null;
    }

    const targetCalendar = calendarId
      ? calendars.find((c) => c.id === calendarId)
      : calendars[0];

    if (!targetCalendar) {
      return null;
    }

    const eventId = await Calendar.createEventAsync(targetCalendar.id, {
      title: responsibility.title,
      notes: responsibility.description,
      startDate: responsibility.schedule.datetime,
      endDate: new Date(
        responsibility.schedule.datetime.getTime() + 60 * 60 * 1000
      ), // Default 1 hour
      timeZone: responsibility.schedule.timezone,
      alarms: responsibility.escalationRules.map((rule) => ({
        relativeOffset: -rule.offsetMinutes,
        method: Calendar.AlarmMethod.ALERT,
      })),
    });

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

