import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type FinancialStage = "foundation" | "wealth" | "goal" | "event";

export interface OnboardingAccount {
  type: string;
  name: string;
  balance: number;
}

export interface OnboardingIncome {
  type: string;
  amount: number;
  frequency: string;
  lowAmount?: number;
  highAmount?: number;
}

export interface OnboardingState {
  currentStep: number;

  name: string;
  language: string;
  currency: string;
  financialStage: FinancialStage | null;
  accounts: OnboardingAccount[];
  income: OnboardingIncome | null;
  healthScore: number;

  isCompleted: boolean;

  setStep: (step: number) => void;
  setName: (name: string) => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setFinancialStage: (stage: FinancialStage | null) => void;
  addAccount: (account: OnboardingAccount) => void;
  setIncome: (income: OnboardingIncome | null) => void;
  setHealthScore: (score: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialState = {
  currentStep: 0,
  name: "",
  language: "en-US",
  currency: "GHS",
  financialStage: null,
  accounts: [],
  income: null,
  healthScore: 0,
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setStep: (step) => set({ currentStep: step }),

        setName: (name) => set({ name }),

        setLanguage: (language) => set({ language }, false, "onboarding/setLanguage"),

        setCurrency: (currency) => set({ currency }, false, "onboarding/setCurrency"),

        setFinancialStage: (financialStage) => set({ financialStage }),

        addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),

        setIncome: (income) => set({ income }),

        setHealthScore: (healthScore) => set({ healthScore }),

        completeOnboarding: () => set({ isCompleted: true }, false, "onboarding/complete"),

        resetOnboarding: () => set({ ...initialState }, false, "onboarding/reset"),
      }),
      {
        name: "onboarding-storage",
        partialize: (state) => ({
          currentStep: state.currentStep,
          name: state.name,
          language: state.language,
          currency: state.currency,
          financialStage: state.financialStage,
          accounts: state.accounts,
          income: state.income,
          healthScore: state.healthScore,
          isCompleted: state.isCompleted,
        }),
      }
    )
  )
);
