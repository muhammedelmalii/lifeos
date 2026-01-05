import { create } from 'zustand';
import { Responsibility, ResponsibilityStatus } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockResponsibilities } from '@/data/mockData';
import { responsibilitiesAPI, CreateResponsibilityInput, UpdateResponsibilityInput } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth';
import { eventSystem } from '@/services/events';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/services/calendar';

interface ResponsibilitiesState {
  responsibilities: Responsibility[];
  isLoading: boolean;
  loadResponsibilities: () => Promise<void>;
  addResponsibility: (responsibility: Responsibility) => Promise<void>;
  updateResponsibility: (id: string, updates: Partial<Responsibility>) => Promise<void>;
  deleteResponsibility: (id: string) => Promise<void>;
  getUpcoming: () => Responsibility[];
  getMissed: () => Responsibility[];
  getSnoozed: () => Responsibility[];
  getActive: () => Responsibility[];
  getNextCritical: () => Responsibility | null;
  checkStateTransitions: () => Promise<void>; // Auto state machine transitions
  getNowMode: () => Responsibility[]; // Low energy, short duration
  getByCategory: (category: string) => Responsibility[];
  getCategories: () => string[];
  getTodayByCategory: (category: string) => Responsibility[];
}

const STORAGE_KEY = '@lifeos:responsibilities';

export const useResponsibilitiesStore = create<ResponsibilitiesState>((set, get) => ({
  responsibilities: [],
  isLoading: false,

  loadResponsibilities: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      
      // First load from local storage (offline-first)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let responsibilities: Responsibility[] = [];
      
      if (stored) {
        const parsed = JSON.parse(stored);
        responsibilities = parsed.map((r: any) => ({
          ...r,
          schedule: {
            ...r.schedule,
            datetime: new Date(r.schedule.datetime),
          },
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
          completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
          snoozedUntil: r.snoozedUntil ? new Date(r.snoozedUntil) : undefined,
        }));
        set({ responsibilities, isLoading: false });
      }

      // Then sync from API if configured and user is authenticated
      if (isSupabaseConfigured() && user) {
        try {
          const apiResponsibilities = await responsibilitiesAPI.getAll(user.id);
          set({ responsibilities: apiResponsibilities });
          // Save to local storage
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(apiResponsibilities));
        } catch (error) {
          console.error('Failed to sync from API, using local data:', error);
          // Continue with local data if API fails
        }
      } else if (!stored) {
        // Load mock data if no stored data and no API
        set({ responsibilities: mockResponsibilities, isLoading: false });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockResponsibilities));
      }
    } catch (error) {
      console.error('Failed to load responsibilities:', error);
      // Fallback to mock data on error
      set({ responsibilities: mockResponsibilities, isLoading: false });
    }
  },

  addResponsibility: async (responsibility: Responsibility) => {
    const responsibilities = [...get().responsibilities, responsibility];
    set({ responsibilities });
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(responsibilities));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        const input: CreateResponsibilityInput = {
          title: responsibility.title,
          description: responsibility.description,
          category: responsibility.category,
          energyRequired: responsibility.energyRequired,
          schedule: responsibility.schedule,
          reminderStyle: responsibility.reminderStyle,
          escalationRules: responsibility.escalationRules,
          checklist: responsibility.checklist,
          createdFrom: responsibility.createdFrom,
          calendarEventId: responsibility.calendarEventId,
        };
        const apiResponsibility = await responsibilitiesAPI.create(input, user.id);
        // Update with API response (includes server-generated fields)
        const updated = responsibilities.map((r) =>
          r.id === responsibility.id ? apiResponsibility : r
        );
        set({ responsibilities: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        
        // Emit created event
        await eventSystem.emit({ type: 'created', responsibility: apiResponsibility });
      } catch (error) {
        console.error('Failed to sync to API:', error);
        // Continue with local data if API fails
        // Still emit event for local responsibility
        await eventSystem.emit({ type: 'created', responsibility });
      }
    } else {
      // Emit created event even without API
      await eventSystem.emit({ type: 'created', responsibility });
    }
  },

  updateResponsibility: async (id: string, updates: Partial<Responsibility>) => {
    const previous = get().responsibilities.find(r => r.id === id);
    if (!previous) return;
    
    const responsibilities = get().responsibilities.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
    );
    set({ responsibilities });
    
    const updated = responsibilities.find(r => r.id === id)!;
    
    // Update calendar event if schedule changed or if we need to create one
    if (updates.schedule || (!previous.calendarEventId && updated.schedule)) {
      try {
        if (previous.calendarEventId) {
          // Update existing calendar event (delete old, create new)
          const newEventId = await updateCalendarEvent(previous.calendarEventId, updated);
          if (newEventId) {
            updated.calendarEventId = newEventId;
            // Update in responsibilities array
            const withCalendarId = responsibilities.map((r) =>
              r.id === id ? { ...r, calendarEventId: newEventId } : r
            );
            set({ responsibilities: withCalendarId });
          }
        } else if (updated.schedule) {
          // Create new calendar event
          const eventId = await createCalendarEvent(updated);
          if (eventId) {
            updated.calendarEventId = eventId;
            const withCalendarId = responsibilities.map((r) =>
              r.id === id ? { ...r, calendarEventId: eventId } : r
            );
            set({ responsibilities: withCalendarId });
          }
        }
      } catch (error) {
        console.error('Failed to update calendar event:', error);
        // Continue without calendar event
      }
    }
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(responsibilities));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        const input: UpdateResponsibilityInput = {
          title: updates.title,
          description: updates.description,
          category: updates.category,
          energyRequired: updates.energyRequired,
          status: updates.status,
          reminderStyle: updates.reminderStyle,
          checklist: updates.checklist,
          completedAt: updates.completedAt,
          snoozedUntil: updates.snoozedUntil,
          schedule: updates.schedule,
          calendarEventId: updated.calendarEventId,
        };
        const apiResponsibility = await responsibilitiesAPI.update(id, input, user.id);
        // Update with API response
        const finalUpdated = responsibilities.map((r) =>
          r.id === id ? apiResponsibility : r
        );
        set({ responsibilities: finalUpdated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(finalUpdated));
        
        // Emit updated event
        await eventSystem.emit({ type: 'updated', responsibility: apiResponsibility, previous });
        
        // Emit specific events based on status changes
        if (updates.status === 'completed' && !previous.completedAt) {
          await eventSystem.emit({ type: 'completed', responsibility: apiResponsibility });
          
          // Update streak when task is completed
          const { gamificationService } = await import('@/services/gamification');
          await gamificationService.updateStreak();
        } else if (updates.status === 'missed' && previous.status !== 'missed') {
          await eventSystem.emit({ type: 'missed', responsibility: apiResponsibility });
        } else if (updates.status === 'snoozed' && previous.status !== 'snoozed') {
          await eventSystem.emit({ type: 'snoozed', responsibility: apiResponsibility });
        }
      } catch (error) {
        console.error('Failed to sync to API:', error);
        // Continue with local data if API fails
        // Still emit events
        await eventSystem.emit({ type: 'updated', responsibility: updated, previous });
        if (updates.status === 'completed' && !previous.completedAt) {
          await eventSystem.emit({ type: 'completed', responsibility: updated });
        } else if (updates.status === 'missed' && previous.status !== 'missed') {
          await eventSystem.emit({ type: 'missed', responsibility: updated });
        } else if (updates.status === 'snoozed' && previous.status !== 'snoozed') {
          await eventSystem.emit({ type: 'snoozed', responsibility: updated });
        }
      }
    } else {
      // Emit events even without API
      await eventSystem.emit({ type: 'updated', responsibility: updated, previous });
      if (updates.status === 'completed' && !previous.completedAt) {
        await eventSystem.emit({ type: 'completed', responsibility: updated });
      } else if (updates.status === 'missed' && previous.status !== 'missed') {
        await eventSystem.emit({ type: 'missed', responsibility: updated });
      } else if (updates.status === 'snoozed' && previous.status !== 'snoozed') {
        await eventSystem.emit({ type: 'snoozed', responsibility: updated });
      }
    }
  },

  deleteResponsibility: async (id: string) => {
    const responsibility = get().responsibilities.find(r => r.id === id);
    
    // Delete calendar event if exists
    if (responsibility?.calendarEventId) {
      try {
        await deleteCalendarEvent(responsibility.calendarEventId);
      } catch (error) {
        console.error('Failed to delete calendar event:', error);
        // Continue with deletion even if calendar event deletion fails
      }
    }
    
    const responsibilities = get().responsibilities.filter((r) => r.id !== id);
    set({ responsibilities });
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(responsibilities));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        await responsibilitiesAPI.delete(id, user.id);
      } catch (error) {
        console.error('Failed to delete from API:', error);
        // Continue with local deletion if API fails
      }
    }
    
    // Emit deleted event
    await eventSystem.emit({ type: 'deleted', responsibilityId: id });
  },

  getUpcoming: () => {
    const now = new Date();
    return get()
      .responsibilities.filter(
        (r) =>
          r.status === 'active' &&
          r.schedule?.datetime &&
          r.schedule.datetime > now &&
          !r.snoozedUntil
      )
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });
  },

  getMissed: () => {
    const now = new Date();
    return get()
      .responsibilities.filter(
        (r) =>
          r.status === 'missed' ||
          (r.status === 'active' && r.schedule?.datetime && r.schedule.datetime < now && !r.completedAt)
      )
      .sort((a, b) => {
        const aDate = a.schedule?.datetime;
        const bDate = b.schedule?.datetime;
        if (!aDate || !bDate) return 0;
        return bDate.getTime() - aDate.getTime();
      });
  },

  getSnoozed: () => {
    const now = new Date();
    return get()
      .responsibilities.filter(
        (r) => r.status === 'snoozed' || (r.snoozedUntil && r.snoozedUntil > now)
      )
      .sort((a, b) => {
        const aDate = a.snoozedUntil || a.schedule?.datetime;
        const bDate = b.snoozedUntil || b.schedule?.datetime;
        if (!aDate || !bDate) return 0;
        return aDate.getTime() - bDate.getTime();
      });
  },

  getActive: () => {
    const now = new Date();
    return get()
      .responsibilities.filter(
        (r) =>
          r.status === 'active' &&
          r.schedule?.datetime &&
          r.schedule.datetime <= now &&
          !r.completedAt &&
          !r.snoozedUntil
      )
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });
  },

  getNextCritical: () => {
    const upcoming = get().getUpcoming();
    const critical = upcoming.filter((r) => r.reminderStyle === 'critical');
    if (critical.length > 0) {
      return critical[0];
    }
    return upcoming.length > 0 ? upcoming[0] : null;
  },

  checkStateTransitions: async () => {
    const now = new Date();
    const responsibilities = get().responsibilities;
    let hasChanges = false;
    const updated = responsibilities.map((r) => {
      // active → missed: time passed, not completed
      if (
        r.status === 'active' &&
        r.schedule?.datetime &&
        r.schedule.datetime < now &&
        !r.completedAt &&
        !r.snoozedUntil
      ) {
        hasChanges = true;
        return { ...r, status: 'missed' as ResponsibilityStatus, updatedAt: now };
      }
      // snoozed → active: snoozedUntil time passed
      if (r.status === 'snoozed' && r.snoozedUntil && r.snoozedUntil <= now) {
        hasChanges = true;
        return { ...r, status: 'active' as ResponsibilityStatus, snoozedUntil: undefined, updatedAt: now };
      }
      // snoozed → missed: snoozedUntil passed, still not completed
      if (
        r.status === 'snoozed' &&
        r.snoozedUntil &&
        r.snoozedUntil < now &&
        !r.completedAt
      ) {
        hasChanges = true;
        return { ...r, status: 'missed' as ResponsibilityStatus, snoozedUntil: undefined, updatedAt: now };
      }
      return r;
    });

    if (hasChanges) {
      set({ responsibilities: updated });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save state transitions:', error);
      }
    }
  },

  getNowMode: () => {
    const now = new Date();
    const active = get().getActive();
    // Filter: low energy, short duration (5-15 min), no critical
    return active
      .filter((r) => {
        // Only low energy
        if (r.energyRequired !== 'low') return false;
        // No critical items
        if (r.reminderStyle === 'critical') return false;
        // Estimate duration from checklist or assume short
        const estimatedMinutes = r.checklist.length * 5 || 10;
        return estimatedMinutes <= 15;
      })
      .slice(0, 5); // Max 5 items
  },

  getByCategory: (category: string) => {
    return get()
      .responsibilities.filter(
        (r) => r.category?.toLowerCase() === category.toLowerCase() && r.status === 'active' && r.schedule?.datetime
      )
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });
  },

  getCategories: () => {
    const categories = new Set<string>();
    get()
      .responsibilities.filter((r) => r.category && r.status === 'active')
      .forEach((r) => {
        if (r.category) categories.add(r.category);
      });
    return Array.from(categories).sort();
  },

  getTodayByCategory: (category: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return get()
      .responsibilities.filter(
        (r) =>
          (!category || r.category?.toLowerCase() === category.toLowerCase()) &&
          r.status === 'active' &&
          r.schedule?.datetime &&
          r.schedule.datetime >= today &&
          r.schedule.datetime < tomorrow
      )
      .sort((a, b) => {
        if (!a.schedule?.datetime || !b.schedule?.datetime) return 0;
        return a.schedule.datetime.getTime() - b.schedule.datetime.getTime();
      });
  },
}));

