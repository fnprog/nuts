import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PieChart, Target, TrendingUp, Shield, Smartphone, ArrowLeft, BarChart3, CreditCard, Calendar } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { H1, Muted } from "@/core/components/ui/typography";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const features = [
  {
    icon: PieChart,
    title: "Expense Tracking",
    description: "Automatically categorize your transactions and see where your money goes with beautiful charts and insights.",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set and track financial goals like saving for vacation, emergency fund, or that dream purchase.",
  },
  {
    icon: TrendingUp,
    title: "Net Worth Tracking",
    description: "Monitor your wealth over time by connecting all your accounts in one secure dashboard.",
  },
  {
    icon: BarChart3,
    title: "Budget Management",
    description: "Create flexible budgets that adapt to your lifestyle and get alerts when you're overspending.",
  },
  {
    icon: CreditCard,
    title: "Account Aggregation",
    description: "Connect checking, savings, credit cards, and investment accounts for a complete financial picture.",
  },
  {
    icon: Calendar,
    title: "Bill Reminders",
    description: "Never miss a payment again with smart reminders and recurring transaction tracking.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Your data is protected with 256-bit encryption and read-only access to your accounts.",
  },
  {
    icon: Smartphone,
    title: "Mobile & Web",
    description: "Access your finances anywhere with our responsive design that works on all your devices.",
  },
];

export const Route = createFileRoute("/onboarding/features")({
  component: RouteComponent,
});

//TODO: ADD A Carousel over here instead of what we have
//REF: https://ui.aceternity.com/components/apple-cards-carousel
function RouteComponent() {
  const navigate = useNavigate();
  const { setStep } = useOnboardingStore();

  const handleBack = async () => {
    setStep(2);
    await navigate({ to: "/onboarding/social-proof" });
  };

  const handleContinue = async () => {
    setStep(4);
    await navigate({ to: "/onboarding/goals" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[calc(100vh-200px)] flex-col w-full  max-w-md"
    >
      <div className="flex-1 space-y-8">
        <div className="space-y-3 text-center">
          <H1 className="font-semibold">Here's how Nuts can help you</H1>
          <Muted className="text-base">Powerful features designed to simplify your financial life</Muted>
        </div>

        <ScrollArea className="h-96 w-full rounded-md border border-gray-200 bg-white">
          <div className="space-y-3 p-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="flex items-start space-x-4 rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                >
                  <div className="shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex items-center justify-between pt-8">
        <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} variant="primary" className=" px-8 ">
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
