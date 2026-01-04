import { format, parse, isToday, isTomorrow, isYesterday, addDays, startOfDay } from 'date-fns';

export const formatDateTime = (date: Date | string | null | undefined): string => {
  // Handle invalid or missing dates
  if (!date) {
    return 'No date set';
  }

  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  if (isToday(dateObj)) {
    return `Today ${format(dateObj, 'h:mm a')}`;
  }
  if (isTomorrow(dateObj)) {
    return `Tomorrow ${format(dateObj, 'h:mm a')}`;
  }
  if (isYesterday(dateObj)) {
    return `Yesterday ${format(dateObj, 'h:mm a')}`;
  }
  return format(dateObj, 'MMM d, h:mm a');
};

export const formatDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Today';
  }
  if (isTomorrow(date)) {
    return 'Tomorrow';
  }
  return format(date, 'MMM d, yyyy');
};

export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 0) {
    const absMins = Math.abs(diffMins);
    if (absMins < 60) {
      return `${absMins}m ago`;
    }
    const hours = Math.floor(absMins / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${Math.floor(hours / 24)}d ago`;
  }

  if (diffMins < 60) {
    return `In ${diffMins}m`;
  }
  const hours = Math.floor(diffMins / 60);
  if (hours < 24) {
    return `In ${hours}h`;
  }
  return `In ${Math.floor(hours / 24)}d`;
};

export const getTomorrowMorning = (): Date => {
  const tomorrow = addDays(startOfDay(new Date()), 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow;
};

export const getTonight = (): Date => {
  const tonight = new Date();
  tonight.setHours(20, 0, 0, 0);
  if (tonight < new Date()) {
    return addDays(tonight, 1);
  }
  return tonight;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

