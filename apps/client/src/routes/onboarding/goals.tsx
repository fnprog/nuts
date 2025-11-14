import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { Target, Home, Car, GraduationCap, Heart, Plane, TrendingUp, Shield, ArrowRight, Check } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { H2, H3, P, Small } from "@/core/components/ui/typography";

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
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="bg-primary-nuts-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Target className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <H2 className="text-gray-900">What do you hope to accomplish with Nuts?</H2>
        <P className="text-gray-600">Select all that apply. We'll help you track progress toward these goals.</P>
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
              className={`relative rounded-lg border-2 p-4 text-left transition-all duration-200 ${isSelected ? "border-primary-nuts-400 bg-primary-nuts-50" : "border-gray-200 bg-white hover:border-gray-300"
                } `}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${goal.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <H3 className="text-sm text-gray-900">{goal.title}</H3>
                  <Small className="mt-1 text-gray-600">{goal.description}</Small>
                </div>
                {isSelected && (
                  <div className="bg-primary-nuts-600 flex h-6 w-6 items-center justify-center rounded-full">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-4">
        <Button
          onClick={handleContinue}
          className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 flex w-full items-center justify-center gap-2 bg-linear-to-r text-white shadow-lg"
          disabled={localSelectedGoals.length === 0}
        >
          Continue {localSelectedGoals.length > 0 && `(${localSelectedGoals.length} selected)`}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
        </div>
        <Small className="mt-2 text-gray-500">Step 5 of 6</Small>
      </div>
    </motion.div>
  );
}
