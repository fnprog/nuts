import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import type { AuthNullable } from "../services/auth.types";

export interface AuthState {
  user: AuthNullable;
  isAuthenticated: boolean;
  isAnonymous: boolean;

  setUser: (user: AuthNullable) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setAnonymous: (isAnonymous: boolean) => void;
  resetState: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isAnonymous: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => {

        return {
          ...initialState,
          setUser: (user) => set({ user }),
          setAuthenticated: (auth) => set({ isAuthenticated: auth }),
          setAnonymous: (isAnonymous) => set({ isAnonymous }),
          resetState: () => set({ ...initialState }),
        };
      },
      {
        name: "auth-storage",
        partialize: ({ isAuthenticated, isAnonymous }) => ({ isAuthenticated, isAnonymous }),
      }
    )
  )
);
