import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  firstName: string;
  lastName: string;
  wantsBetterFinance: boolean | null;
  selectedGoals: string[];
  hasComplexFinance: boolean | null;
  setStep: (step: number) => void;
  setName: (firstName: string, lastName: string) => void;
  setBetterFinance: (wants: boolean | null) => void;
  setGoals: (goals: string[]) => void;
  setComplexFinance: (complex: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      isCompleted: false,
      currentStep: 0,
      firstName: '',
      lastName: '',
      wantsBetterFinance: null,
      selectedGoals: [],
      hasComplexFinance: null,
      setStep: (step) => set({ currentStep: step }),
      setName: (firstName, lastName) => set({ firstName, lastName }),
      setBetterFinance: (wants) => set({ wantsBetterFinance: wants }),
      setGoals: (goals) => set({ selectedGoals: goals }),
      setComplexFinance: (complex) => set({ hasComplexFinance: complex }),
      completeOnboarding: () => set({ isCompleted: true }),
      resetOnboarding: () =>
        set({
          isCompleted: false,
          currentStep: 0,
          firstName: '',
          lastName: '',
          wantsBetterFinance: null,
          selectedGoals: [],
          hasComplexFinance: null,
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
