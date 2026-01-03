import { Responsibility, List } from '@/types';

// Helper to create dates
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

export const mockResponsibilities: Responsibility[] = [
  // Critical - happening now
  {
    id: '1',
    title: 'Team Standup Meeting',
    description: 'Daily sync with engineering team',
    category: 'Work',
    energyRequired: 'medium',
    schedule: {
      type: 'recurring',
      datetime: twoHoursLater,
      timezone: 'UTC',
      rrule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR',
    },
    reminderStyle: 'critical',
    escalationRules: [
      { offsetMinutes: -15, channel: 'notification', strength: 'gentle' },
      { offsetMinutes: -5, channel: 'notification', strength: 'persistent' },
      { offsetMinutes: 0, channel: 'fullScreen', strength: 'critical' },
    ],
    status: 'active',
    checklist: [
      { id: 'c1', label: 'Review yesterday\'s progress', done: false },
      { id: 'c2', label: 'Prepare blockers list', done: true },
    ],
    createdFrom: 'text',
    metadata: {
      location: 'Conference Room A',
    },
    createdAt: yesterday,
    updatedAt: now,
  },
  // Upcoming - tomorrow
  {
    id: '2',
    title: 'Dentist Appointment',
    description: 'Regular checkup and cleaning',
    category: 'Health',
    energyRequired: 'low',
    schedule: {
      type: 'one-time',
      datetime: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // Tomorrow 2 PM
      timezone: 'UTC',
    },
    reminderStyle: 'persistent',
    escalationRules: [
      { offsetMinutes: -60, channel: 'notification', strength: 'gentle' },
      { offsetMinutes: -30, channel: 'notification', strength: 'persistent' },
    ],
    status: 'active',
    checklist: [
      { id: 'c3', label: 'Bring insurance card', done: false },
      { id: 'c4', label: 'Review dental history', done: false },
    ],
    createdFrom: 'voice',
    metadata: {
      location: '123 Main St, Dental Clinic',
    },
    createdAt: yesterday,
    updatedAt: yesterday,
  },
  // Missed - yesterday
  {
    id: '3',
    title: 'Grocery Shopping',
    description: 'Weekly groceries for the family',
    category: 'Home',
    energyRequired: 'low',
    schedule: {
      type: 'one-time',
      datetime: oneHourAgo,
      timezone: 'UTC',
    },
    reminderStyle: 'gentle',
    escalationRules: [
      { offsetMinutes: -30, channel: 'notification', strength: 'gentle' },
    ],
    status: 'missed',
    checklist: [
      { id: 'c5', label: 'Milk', done: false },
      { id: 'c6', label: 'Bread', done: false },
      { id: 'c7', label: 'Eggs', done: false },
      { id: 'c8', label: 'Vegetables', done: false },
    ],
    createdFrom: 'text',
    createdAt: new Date(yesterday.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: oneHourAgo,
  },
  // Snoozed
  {
    id: '4',
    title: 'Review Q4 Budget',
    description: 'Analyze spending and plan next quarter',
    category: 'Work',
    energyRequired: 'high',
    schedule: {
      type: 'one-time',
      datetime: yesterday,
      timezone: 'UTC',
    },
    reminderStyle: 'persistent',
    escalationRules: [
      { offsetMinutes: -60, channel: 'notification', strength: 'gentle' },
    ],
    status: 'snoozed',
    checklist: [
      { id: 'c9', label: 'Gather expense reports', done: true },
      { id: 'c10', label: 'Review department budgets', done: false },
    ],
    createdFrom: 'text',
    snoozedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    createdAt: new Date(yesterday.getTime() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: now,
  },
  // Upcoming - next week
  {
    id: '5',
    title: 'Project Presentation',
    description: 'Present Q4 results to stakeholders',
    category: 'Work',
    energyRequired: 'high',
    schedule: {
      type: 'one-time',
      datetime: new Date(nextWeek.getTime() + 10 * 60 * 60 * 1000), // Next week 10 AM
      timezone: 'UTC',
    },
    reminderStyle: 'critical',
    escalationRules: [
      { offsetMinutes: -1440, channel: 'notification', strength: 'gentle' }, // 1 day before
      { offsetMinutes: -60, channel: 'notification', strength: 'persistent' },
      { offsetMinutes: -15, channel: 'notification', strength: 'critical' },
    ],
    status: 'active',
    checklist: [
      { id: 'c11', label: 'Prepare slides', done: false },
      { id: 'c12', label: 'Review data', done: false },
      { id: 'c13', label: 'Practice presentation', done: false },
    ],
    createdFrom: 'text',
    metadata: {
      location: 'Board Room',
    },
    createdAt: yesterday,
    updatedAt: yesterday,
  },
  // Upcoming - today evening
  {
    id: '6',
    title: 'Gym Session',
    description: 'Strength training - Upper body',
    category: 'Health',
    energyRequired: 'high',
    schedule: {
      type: 'recurring',
      datetime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // Today 6 PM
      timezone: 'UTC',
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
    },
    reminderStyle: 'gentle',
    escalationRules: [
      { offsetMinutes: -30, channel: 'notification', strength: 'gentle' },
    ],
    status: 'active',
    checklist: [
      { id: 'c14', label: 'Pack gym bag', done: true },
      { id: 'c15', label: 'Bring water bottle', done: false },
    ],
    createdFrom: 'text',
    createdAt: yesterday,
    updatedAt: yesterday,
  },
  // Completed
  {
    id: '7',
    title: 'Morning Meditation',
    description: '10-minute mindfulness session',
    category: 'Health',
    energyRequired: 'low',
    schedule: {
      type: 'recurring',
      datetime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // Today 7 AM
      timezone: 'UTC',
      rrule: 'FREQ=DAILY',
    },
    reminderStyle: 'gentle',
    escalationRules: [
      { offsetMinutes: -10, channel: 'notification', strength: 'gentle' },
    ],
    status: 'completed',
    checklist: [
      { id: 'c16', label: 'Find quiet space', done: true },
      { id: 'c17', label: 'Set timer', done: true },
    ],
    createdFrom: 'text',
    completedAt: new Date(today.getTime() + 7 * 30 * 60 * 1000), // Completed at 7:30 AM
    createdAt: new Date(yesterday.getTime() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(today.getTime() + 7 * 30 * 60 * 1000),
  },
];

export const mockLists: List[] = [
  {
    id: 'l1',
    name: 'Grocery List',
    type: 'market',
    items: [
      { id: 'i1', label: 'Milk', category: 'Dairy', checked: false, createdAt: yesterday },
      { id: 'i2', label: 'Bread', category: 'Bakery', checked: false, createdAt: yesterday },
      { id: 'i3', label: 'Eggs', category: 'Dairy', checked: true, createdAt: yesterday },
      { id: 'i4', label: 'Tomatoes', category: 'Vegetables', checked: false, createdAt: yesterday },
      { id: 'i5', label: 'Chicken Breast', category: 'Meat', checked: false, createdAt: yesterday },
    ],
    createdAt: yesterday,
    updatedAt: now,
  },
  {
    id: 'l2',
    name: 'Home Improvement',
    type: 'home',
    items: [
      { id: 'i6', label: 'Paint brushes', category: 'Tools', checked: true, createdAt: yesterday },
      { id: 'i7', label: 'Paint', category: 'Supplies', checked: false, createdAt: yesterday },
      { id: 'i8', label: 'Drop cloth', category: 'Supplies', checked: false, createdAt: yesterday },
    ],
    createdAt: new Date(yesterday.getTime() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: yesterday,
  },
  {
    id: 'l3',
    name: 'Work Tasks',
    type: 'work',
    items: [
      { id: 'i9', label: 'Review PR #1234', category: 'Code Review', checked: false, createdAt: yesterday },
      { id: 'i10', label: 'Update documentation', category: 'Documentation', checked: false, createdAt: yesterday },
      { id: 'i11', label: 'Schedule team meeting', category: 'Planning', checked: true, createdAt: yesterday },
    ],
    createdAt: yesterday,
    updatedAt: now,
  },
  {
    id: 'l4',
    name: 'Weekend Plans',
    type: 'custom',
    items: [
      { id: 'i12', label: 'Hike at state park', category: 'Activities', checked: false, createdAt: yesterday },
      { id: 'i13', label: 'Movie night', category: 'Entertainment', checked: false, createdAt: yesterday },
      { id: 'i14', label: 'Meal prep for next week', category: 'Cooking', checked: false, createdAt: yesterday },
    ],
    createdAt: yesterday,
    updatedAt: yesterday,
  },
];

export const mockUser = {
  id: 'user-1',
  email: 'mami@lifeos.app',
  name: 'Mami',
};

