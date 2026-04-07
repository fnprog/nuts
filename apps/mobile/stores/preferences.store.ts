import { create } from 'zustand';
import {
  Preferences,
  DEFAULT_PREFERENCES,
  PreferencesUpdate,
} from '../lib/services/preferences/preferences.types';
import { preferencesStorage } from '../lib/services/preferences/preferences.storage';

interface PreferencesState {
  preferences: Preferences;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  updatePreferences: (updates: PreferencesUpdate) => Promise<void>;
  reset: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  isLoading: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const preferences = await preferencesStorage.get();
      set({ preferences, isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize preferences:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load preferences',
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  updatePreferences: async (updates: PreferencesUpdate) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await preferencesStorage.update(updates);
      set({ preferences: updated, isLoading: false });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to save preferences',
        isLoading: false,
      });
      throw error;
    }
  },

  reset: async () => {
    try {
      set({ isLoading: true, error: null });
      await preferencesStorage.clear();
      set({ preferences: DEFAULT_PREFERENCES, isLoading: false });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to reset preferences',
        isLoading: false,
      });
      throw error;
    }
  },
}));
