import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface OnboardingState {
  currentStep: number;

  name: string;
  language: string;
  currency: string;
  wantsBetterFinance: boolean | null;
  selectedGoals: string[];
  feelsComplexFinance: boolean | null;

  isCompleted: boolean;

  setStep: (step: number) => void;
  setName: (name: string) => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setBetterFinance: (wants: boolean | null) => void;
  setGoals: (goals: string[]) => void;
  setComplexFinance: (feels: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState = {
  currentStep: 0,
  name: "",
  language: "en-US",
  currency: "USD",
  wantsBetterFinance: null,
  selectedGoals: [],
  feelsComplexFinance: null,
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ currentStep: step }),

        setName: (name) => set({ name }),

        setLanguage: (language) => set({ language }, false, 'onboarding/setLanguage'),

        setCurrency: (currency) => set({ currency }, false, 'onboarding/setCurrency'),

        setBetterFinance: (wantsBetterFinance) => set({ wantsBetterFinance }),

        setGoals: (selectedGoals) =>
          set({ selectedGoals }, false, 'onboarding/setGoals'),

        setComplexFinance: (feelsComplexFinance) =>
          set({ feelsComplexFinance }, false, 'onboarding/setComplexFinance'),

        completeOnboarding: () =>
          set({ isCompleted: true }, false, 'onboarding/complete'),

        resetOnboarding: () =>
          set({ ...initialState }, false, 'onboarding/reset'),
      }),
      {
        name: "onboarding-storage",
        partialize: (state) => ({
          currentStep: state.currentStep,
          name: state.name,
          language: state.language,
          currency: state.currency,
          wantsBetterFinance: state.wantsBetterFinance,
          selectedGoals: state.selectedGoals,
          feelsComplexFinance: state.feelsComplexFinance,
          isCompleted: state.isCompleted,
        }),
      }
    )
  )
);
