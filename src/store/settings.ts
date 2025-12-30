import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage as setI18nLanguage } from '@/i18n';

export type Language = 'en' | 'tr';

interface SettingsState {
  language: Language;
  reminderIntensity: 'gentle' | 'persistent' | 'critical';
  briefingSchedule: { morning: boolean; evening: boolean };
  isLoading?: boolean;
  loadSettings: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setReminderIntensity: (intensity: 'gentle' | 'persistent' | 'critical') => Promise<void>;
  setReminderStyle: (style: 'gentle' | 'persistent' | 'critical') => Promise<void>;
  setBriefingSchedule: (schedule: { morning: boolean; evening: boolean }) => Promise<void>;
}

const STORAGE_KEY = '@lifeos:settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  reminderIntensity: 'gentle',
  briefingSchedule: { morning: true, evening: false },
  isLoading: false,

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const language = parsed.language || 'en';
        set({
          language,
          reminderIntensity: parsed.reminderIntensity || parsed.reminderStyle || 'gentle',
          briefingSchedule: parsed.briefingSchedule || { morning: true, evening: false },
        });
        setI18nLanguage(language);
      } else {
        setI18nLanguage('en');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setLanguage: async (lang: Language) => {
    set({ language: lang });
    setI18nLanguage(lang);
    try {
      const current = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  },

  setReminderIntensity: async (intensity: 'gentle' | 'persistent' | 'critical') => {
    set({ reminderIntensity: intensity });
    try {
      const current = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Failed to save reminder intensity:', error);
    }
  },

  setReminderStyle: async (style: 'gentle' | 'persistent' | 'critical') => {
    set({ reminderIntensity: style });
    try {
      const current = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Failed to save reminder style:', error);
    }
  },

  setBriefingSchedule: async (schedule: { morning: boolean; evening: boolean }) => {
    set({ briefingSchedule: schedule });
    try {
      const current = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (error) {
      console.error('Failed to save briefing schedule:', error);
    }
  },
}));

