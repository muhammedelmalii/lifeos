/**
 * Notes Store
 * Manages notes (quick notes, reminders, thoughts)
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from './auth';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  searchNotes: (query: string) => Note[];
  getNotesByTag: (tag: string) => Note[];
  getNotesByCategory: (category: string) => Note[];
}

const STORAGE_KEY = '@lifeos:notes';

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const user = useAuthStore.getState().user;
      
      // Load from local storage (offline-first)
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const notes: Note[] = parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          updatedAt: new Date(n.updatedAt),
        }));
        set({ notes, isLoading: false });
      }

      // Sync from API if configured and user is authenticated
      if (isSupabaseConfigured() && user) {
        try {
          // TODO: Implement API sync when backend is ready
          // const apiNotes = await notesAPI.getAll(user.id);
          // set({ notes: apiNotes });
          // await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(apiNotes));
        } catch (error) {
          console.error('Failed to sync notes from API, using local data:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      set({ notes: [], isLoading: false });
    }
  },

  addNote: async (note: Note) => {
    const notes = [...get().notes, note];
    set({ notes });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
        // await notesAPI.create(note, user.id);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const notes = get().notes.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
    );
    set({ notes });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
        // await notesAPI.update(id, updates, user.id);
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  },

  deleteNote: async (id: string) => {
    const notes = get().notes.filter(n => n.id !== id);
    set({ notes });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      
      const user = useAuthStore.getState().user;
      if (isSupabaseConfigured() && user) {
        // TODO: Sync to API
        // await notesAPI.delete(id, user.id);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  },

  archiveNote: async (id: string) => {
    await get().updateNote(id, { archived: true });
  },

  searchNotes: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().notes.filter(note => 
      !note.archived &&
      (note.content.toLowerCase().includes(lowerQuery) ||
       note.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
       note.category?.toLowerCase().includes(lowerQuery))
    );
  },

  getNotesByTag: (tag: string) => {
    return get().notes.filter(note => 
      !note.archived && note.tags?.includes(tag)
    );
  },

  getNotesByCategory: (category: string) => {
    return get().notes.filter(note => 
      !note.archived && note.category === category
    );
  },
}));


