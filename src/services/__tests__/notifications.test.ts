import { scheduleResponsibilityNotifications } from '../notifications';
import { Responsibility } from '@/types';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
    MAX: 5,
  },
  AndroidNotificationPriority: {
    HIGH: 1,
    MAX: 2,
  },
}));

describe('Notification Service', () => {
  it('should schedule main notification for responsibility', async () => {
    const responsibility: Responsibility = {
      id: 'test-1',
      title: 'Test Responsibility',
      description: 'Test description',
      energyRequired: 'medium',
      schedule: {
        type: 'one-time',
        datetime: new Date(Date.now() + 3600000), // 1 hour from now
        timezone: 'America/New_York',
      },
      reminderStyle: 'gentle',
      escalationRules: [
        { offsetMinutes: 15, channel: 'notification', strength: 'gentle' },
      ],
      status: 'active',
      checklist: [],
      createdFrom: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const notificationIds = await scheduleResponsibilityNotifications(responsibility);
    expect(notificationIds.length).toBeGreaterThan(0);
  });

  it('should schedule escalation notifications', async () => {
    const responsibility: Responsibility = {
      id: 'test-2',
      title: 'Test with Escalation',
      energyRequired: 'high',
      schedule: {
        type: 'one-time',
        datetime: new Date(Date.now() + 7200000), // 2 hours from now
        timezone: 'America/New_York',
      },
      reminderStyle: 'critical',
      escalationRules: [
        { offsetMinutes: 60, channel: 'notification', strength: 'persistent' },
        { offsetMinutes: 15, channel: 'fullScreen', strength: 'critical' },
      ],
      status: 'active',
      checklist: [],
      createdFrom: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const notificationIds = await scheduleResponsibilityNotifications(responsibility);
    // Should have main + 2 escalation notifications
    expect(notificationIds.length).toBe(3);
  });
});

