import AsyncStorage from '@react-native-async-storage/async-storage';
import { Preferences, DEFAULT_PREFERENCES } from './preferences.types';

const STORAGE_KEY = '@nuts_preferences';

export const preferencesStorage = {
  async get(): Promise<Preferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) {
        return DEFAULT_PREFERENCES;
      }
      const parsed = JSON.parse(data);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  async set(preferences: Preferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  },

  async update(updates: Partial<Preferences>): Promise<Preferences> {
    const current = await this.get();
    const updated = { ...current, ...updates };
    await this.set(updated);
    return updated;
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear preferences:', error);
      throw error;
    }
  },
};
