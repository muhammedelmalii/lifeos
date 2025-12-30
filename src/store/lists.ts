import { create } from 'zustand';
import { List } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockLists } from '@/data/mockData';
import { listsAPI, CreateListInput, UpdateListInput } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth';

interface ListsState {
  lists: List[];
  isLoading: boolean;
  loadLists: () => Promise<void>;
  addList: (list: List) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  getList: (id: string) => List | undefined;
}

const STORAGE_KEY = '@lifeos:lists';

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  isLoading: false,

  loadLists: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      
      // First load from local storage (offline-first)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let lists: List[] = [];
      
      if (stored) {
        const parsed = JSON.parse(stored);
        lists = parsed.map((l: any) => ({
          ...l,
          items: l.items || [],
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        }));
        set({ lists, isLoading: false });
      }

      // Then sync from API if configured and user is authenticated
      if (isSupabaseConfigured() && user) {
        try {
          const apiLists = await listsAPI.getAll(user.id);
          set({ lists: apiLists });
          // Save to local storage
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(apiLists));
        } catch (error) {
          console.error('Failed to sync from API, using local data:', error);
          // Continue with local data if API fails
        }
      } else if (!stored) {
        // Load mock data if no stored data and no API
        set({ lists: mockLists, isLoading: false });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockLists));
      }
    } catch (error) {
      console.error('Failed to load lists:', error);
      // Fallback to mock data on error
      set({ lists: mockLists, isLoading: false });
    }
  },

  addList: async (list: List) => {
    const lists = [...get().lists, list];
    set({ lists });
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        const input: CreateListInput = {
          name: list.name,
          type: list.type,
          items: list.items.map(item => ({
            ...item,
            createdAt: item.createdAt || new Date(),
          })),
        };
        const apiList = await listsAPI.create(input, user.id);
        // Update with API response
        const updated = lists.map((l) =>
          l.id === list.id ? apiList : l
        );
        set({ lists: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to sync to API:', error);
        // Continue with local data if API fails
      }
    }
  },

  updateList: async (id: string, updates: Partial<List>) => {
    const lists = get().lists.map((l) =>
      l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l
    );
    set({ lists });
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        const input: UpdateListInput = {
          name: updates.name,
          type: updates.type,
          items: updates.items,
        };
        const apiList = await listsAPI.update(id, input, user.id);
        // Update with API response
        const updated = lists.map((l) =>
          l.id === id ? apiList : l
        );
        set({ lists: updated });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to sync to API:', error);
        // Continue with local data if API fails
      }
    }
  },

  deleteList: async (id: string) => {
    const lists = get().lists.filter((l) => l.id !== id);
    set({ lists });
    
    // Save to local storage immediately
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }

    // Sync to API if configured
    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured() && user) {
      try {
        await listsAPI.delete(id, user.id);
      } catch (error) {
        console.error('Failed to delete from API:', error);
        // Continue with local deletion if API fails
      }
    }
  },

  getList: (id: string) => {
    return get().lists.find((l) => l.id === id);
  },
}));

