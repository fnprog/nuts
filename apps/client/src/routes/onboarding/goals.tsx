import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Home, Car, GraduationCap, Heart, Plane, TrendingUp, Shield, ArrowLeft, Check } from "lucide-react";

import { H1, Muted } from "@/core/components/ui/typography";
import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const goalOptions = [
  {
    id: "emergency-fund",
    title: "Build Emergency Fund",
    description: "Save 3-6 months of expenses",
    icon: Shield,
    color: "bg-red-100 text-red-600",
  },
  {
    id: "pay-debt",
    title: "Pay Off Debt",
    description: "Eliminate credit card or loan debt",
    icon: TrendingUp,
    color: "bg-orange-100 text-orange-600",
  },
  {
    id: "buy-home",
    title: "Buy a Home",
    description: "Save for down payment",
    icon: Home,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "buy-car",
    title: "Buy a Car",
    description: "Save for vehicle purchase",
    icon: Car,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "vacation",
    title: "Plan a Vacation",
    description: "Save for travel experiences",
    icon: Plane,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "education",
    title: "Education/Training",
    description: "Fund learning opportunities",
    icon: GraduationCap,
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    id: "wedding",
    title: "Wedding/Event",
    description: "Save for special occasions",
    icon: Heart,
    color: "bg-pink-100 text-pink-600",
  },
  {
    id: "investment",
    title: "Start Investing",
    description: "Build long-term wealth",
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-600",
  },
];

export const Route = createFileRoute("/onboarding/goals")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { selectedGoals, setGoals, setStep } = useOnboardingStore();
  const [localSelectedGoals, setLocalSelectedGoals] = useState<string[]>(selectedGoals);

  const handleGoalToggle = (goalId: string) => {
    setLocalSelectedGoals((prev) => (prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]));
  };

  const handleBack = async () => {
    setStep(3);
    await navigate({ to: "/onboarding/features" });
  };

  const handleContinue = async () => {
    setGoals(localSelectedGoals);
    setStep(5);
    await navigate({ to: "/onboarding/complexity" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[calc(100vh-200px)] flex-col w-full  max-w-xl"
    >
      <div className="flex-1 gap-8 flex flex-col items-center">
        <div className="space-y-3 text-center max-w-md w-full  ">
          <H1 className="font-semibold">What do you hope to accomplish with Nuts Finance?</H1>
          <Muted className="text-base">Select all that apply. We'll help you track progress toward these goals.</Muted>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
          {goalOptions.map((goal, index) => {
            const Icon = goal.icon;
            const isSelected = localSelectedGoals.includes(goal.id);

            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.1 }}
                onClick={() => handleGoalToggle(goal.id)}
                className={`relative rounded-lg border-2 p-4 text-left transition-all duration-200 ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${goal.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{goal.title}</h3>
                    <p className="mt-1 text-xs text-gray-600">{goal.description}</p>
                  </div>
                  {isSelected && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center justify-between pt-8">
        <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} className="bg-blue-600 px-8 text-white hover:bg-blue-700" disabled={localSelectedGoals.length === 0}>
          Continue {localSelectedGoals.length > 0 && `(${localSelectedGoals.length})`}
        </Button>
      </motion.div>
    </motion.div>
  );
}
