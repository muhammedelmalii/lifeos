import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockUser } from '@/data/mockData';
import { authAPI } from '@/services/api';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AuthState {
  user: { id: string; email?: string; name?: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: { id: string; email?: string; name?: string } | null) => Promise<void>;
  logout: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  checkSession: () => Promise<void>;
}

const STORAGE_KEY = '@lifeos:user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: async (user) => {
    set({ user, isAuthenticated: !!user });
    try {
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  },

  logout: async () => {
    try {
      if (isSupabaseConfigured()) {
        await authAPI.signOut();
      }
    } catch (error) {
      console.error('Failed to sign out from API:', error);
    }
    set({ user: null, isAuthenticated: false });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user:', error);
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    try {
      if (isSupabaseConfigured()) {
        const user = await authAPI.signInWithEmail(email, password);
        await get().setUser(user);
      } else {
        // Fallback to mock for development
        await get().setUser(mockUser);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  signUpWithEmail: async (email: string, password: string, name?: string) => {
    try {
      if (isSupabaseConfigured()) {
        const user = await authAPI.signUpWithEmail(email, password, name);
        await get().setUser(user);
      } else {
        // Fallback to mock for development
        await get().setUser({ id: Date.now().toString(), email, name });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  signInWithGoogle: async () => {
    try {
      if (isSupabaseConfigured()) {
        const user = await authAPI.signInWithGoogle();
        await get().setUser(user);
      } else {
        // Fallback to mock for development
        await get().setUser(mockUser);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  signInWithApple: async () => {
    try {
      if (isSupabaseConfigured()) {
        const user = await authAPI.signInWithApple();
        await get().setUser(user);
      } else {
        // Fallback to mock for development
        await get().setUser(mockUser);
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  },

  signInWithMagicLink: async (email: string) => {
    try {
      if (isSupabaseConfigured()) {
        await authAPI.signInWithMagicLink(email);
        // Magic link sends email, user will be set when they click the link
      } else {
        // Fallback to mock for development
        await get().setUser({ id: Date.now().toString(), email });
      }
    } catch (error) {
      console.error('Magic link error:', error);
      throw error;
    }
  },

  checkSession: async () => {
    try {
      if (isSupabaseConfigured()) {
        const user = await authAPI.getCurrentUser();
        if (user) {
          await get().setUser(user);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  },
}));

// Load user on init (async to avoid blocking)
// Web-safe initialization - only run in browser environment
if (typeof window !== 'undefined') {
  (async () => {
    try {
      // First check Supabase session if configured
      if (isSupabaseConfigured()) {
        try {
          await useAuthStore.getState().checkSession();
        } catch (error) {
          // Silently fail if session check fails
          console.warn('Session check failed:', error);
        }
      }

      // Fallback to local storage
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const user = JSON.parse(stored);
            // Only set if no user from Supabase session
            if (!useAuthStore.getState().user) {
              useAuthStore.getState().setUser(user);
            }
          } catch (error) {
            console.error('Failed to parse stored user:', error);
          }
        }
      } catch (error) {
        // AsyncStorage might fail in some environments
        console.warn('Failed to read from storage:', error);
      }
    } catch (error) {
      console.error('Failed to initialize auth store:', error);
    } finally {
      // Always set loading to false
      useAuthStore.setState({ isLoading: false });
    }
  })();
} else {
  // SSR environment - just set loading to false
  useAuthStore.setState({ isLoading: false });
}

