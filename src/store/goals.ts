/**
 * Goals Store
 * Manages goals and progress tracking
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Milestone } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth';

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateProgress: (id: string, progress: number) => Promise<void>;
  completeMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getGoalsByCategory: (category: string) => Goal[];
}

const STORAGE_KEY = '@lifeos:goals';

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      
      // Load from local storage (offline-first)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const goals: Goal[] = parsed.map((g: any) => ({
          ...g,
          targetDate: g.targetDate ? new Date(g.targetDate) : undefined,
          createdAt: new Date(g.createdAt),
          updatedAt: new Date(g.updatedAt),
          completedAt: g.completedAt ? new Date(g.completedAt) : undefined,
          milestones: g.milestones?.map((m: any) => ({
            ...m,
            completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
          })),
        }));
        set({ goals, isLoading: false });
      }

      // Sync from API if configured and user is authenticated
      if (isSupabaseConfigured() && user) {
        try {
          // TODO: Implement API sync when backend is ready
        } catch (error) {
          console.error('Failed to sync goals from API, using local data:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      set({ goals: [], isLoading: false });
    }
  },

  addGoal: async (goal: Goal) => {
    const goals = [...get().goals, goal];
    set({ goals });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
      }
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  },

  updateGoal: async (id: string, updates: Partial<Goal>) => {
    const goals = get().goals.map(g => {
      if (g.id === id) {
        const updated = { ...g, ...updates, updatedAt: new Date() };
        // Auto-complete if progress reaches 100
        if (updated.progress >= 100 && updated.status === 'active') {
          updated.status = 'completed';
          updated.completedAt = new Date();
        }
        return updated;
      }
      return g;
    });
    set({ goals });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
      }
    } catch (error) {
      console.error('Failed to update goal:', error);
    }
  },

  deleteGoal: async (id: string) => {
    const goals = get().goals.filter(g => g.id !== id);
    set({ goals });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
    }
  },

  updateProgress: async (id: string, progress: number) => {
    await get().updateGoal(id, { progress: Math.min(100, Math.max(0, progress)) });
  },

  completeMilestone: async (goalId: string, milestoneId: string) => {
    const goals = get().goals.map(goal => {
      if (goal.id === goalId && goal.milestones) {
        const milestones = goal.milestones.map(m => 
          m.id === milestoneId 
            ? { ...m, completed: true, completedAt: new Date() }
            : m
        );
        
        // Calculate progress based on completed milestones
        const completedCount = milestones.filter(m => m.completed).length;
        const progress = milestones.length > 0 
          ? Math.round((completedCount / milestones.length) * 100)
          : goal.progress;
        
        return {
          ...goal,
          milestones,
          progress,
          updatedAt: new Date(),
        };
      }
      return goal;
    });
    set({ goals });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to update milestone:', error);
    }
  },

  getActiveGoals: () => {
    return get().goals.filter(g => g.status === 'active');
  },

  getCompletedGoals: () => {
    return get().goals.filter(g => g.status === 'completed');
  },

  getGoalsByCategory: (category: string) => {
    return get().goals.filter(g => g.category === category && g.status === 'active');
  },
}));


