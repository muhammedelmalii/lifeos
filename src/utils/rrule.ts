import { RRule } from 'rrule';

export const parseRRule = (rruleString: string): RRule | null => {
  try {
    return RRule.fromString(rruleString);
  } catch {
    return null;
  }
};

export const createRRule = (
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  interval: number = 1,
  byweekday?: number[],
  dtstart?: Date
): string => {
  const rule = new RRule({
    freq: RRule[freq] as any,
    interval,
    dtstart: dtstart || new Date(),
  });
  return rule.toString();
};

export const formatRRule = (rruleString: string): string => {
  const rule = parseRRule(rruleString);
  if (!rule) return '';

  const freq = rule.options.freq;
  const interval = rule.options.interval || 1;

  if (freq === RRule.DAILY) {
    return interval === 1 ? 'Daily' : `Every ${interval} days`;
  }
  if (freq === RRule.WEEKLY) {
    const byweekday = rule.options.byweekday;
    if (byweekday && byweekday.length > 0) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayNames = byweekday.map((d: any) => days[d.weekday || d]).join(', ');
      return `Weekly ${dayNames}`;
    }
    return interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
  }
  if (freq === RRule.MONTHLY) {
    return interval === 1 ? 'Monthly' : `Every ${interval} months`;
  }
  if (freq === RRule.YEARLY) {
    return interval === 1 ? 'Yearly' : `Every ${interval} years`;
  }
  return 'Recurring';
};

