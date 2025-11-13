import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateSyncServiceAuth, resetSyncServices } from '@/lib/sync';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAnonymous: (anonymous: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isAnonymous: false,
      token: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => {
        set({ token });
        updateSyncServiceAuth(token);
      },
      setAnonymous: (anonymous) => set({ isAnonymous: anonymous }),
      login: (user, token) => {
        set({ user, token, isAuthenticated: true, isAnonymous: false });
        updateSyncServiceAuth(token);
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isAnonymous: false });
        resetSyncServices();
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
