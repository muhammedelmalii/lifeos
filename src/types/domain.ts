export type EnergyLevel = 'low' | 'medium' | 'high';
export type ReminderStyle = 'gentle' | 'persistent' | 'critical';
export type ResponsibilityStatus = 'active' | 'completed' | 'missed' | 'snoozed' | 'archived';
export type ScheduleType = 'one-time' | 'recurring';
export type CreatedFrom = 'text' | 'voice' | 'photo';

export interface Schedule {
  type: ScheduleType;
  datetime: Date;
  timezone: string;
  rrule?: string; // RRULE string for recurring
}

export interface EscalationRule {
  offsetMinutes: number;
  channel: 'notification' | 'fullScreen';
  strength: ReminderStyle;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ResponsibilityMetadata {
  links?: string[];
  location?: string;
  contactId?: string;
}

export interface Responsibility {
  id: string;
  title: string;
  description?: string;
  category?: string;
  energyRequired: EnergyLevel;
  schedule: Schedule;
  reminderStyle: ReminderStyle;
  escalationRules: EscalationRule[];
  status: ResponsibilityStatus;
  checklist: ChecklistItem[];
  createdFrom: CreatedFrom;
  metadata?: ResponsibilityMetadata;
  calendarEventId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  snoozedUntil?: Date;
}

export type ListType = 'market' | 'home' | 'work' | 'custom';

export interface ListItem {
  id: string;
  label: string;
  category?: string;
  checked: boolean;
  createdAt: Date;
}

export interface List {
  id: string;
  name: string;
  type: ListType;
  items: ListItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type PersonDateType = 'birthday' | 'special';

export interface PersonDate {
  id: string;
  name: string;
  date: Date;
  type: PersonDateType;
  reminderRules: EscalationRule[];
}

export type BriefingType = 'morning' | 'evening';

export interface BriefingContentBlock {
  type: 'text' | 'list' | 'action';
  content: string;
  items?: string[];
  actionId?: string;
}

export interface Briefing {
  id: string;
  generatedAt: Date;
  type: BriefingType;
  contentBlocks: BriefingContentBlock[];
}

