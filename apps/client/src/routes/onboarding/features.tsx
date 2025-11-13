import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PieChart, Target, TrendingUp, Shield, Smartphone, ArrowRight, BarChart3, CreditCard, Calendar } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { ScrollArea } from "@/core/components/ui/scroll-area";
import { H2, P, H3, Small } from "@/core/components/ui/typography";
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

function RouteComponent() {
  const navigate = useNavigate();
  const { setStep } = useOnboardingStore();

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
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="bg-primary-nuts-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <BarChart3 className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <H2>Here's how Nuts can help you</H2>
        <P variant="muted">Powerful features designed to simplify your financial life</P>
      </div>

      <ScrollArea className="h-96 w-full rounded-md border border-gray-200 bg-white">
        <div className="space-y-4 p-4">
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
                <div className="flex-shrink-0">
                  <div className="bg-primary-nuts-100 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Icon className="text-primary-nuts-600 h-6 w-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <H3 className="mb-1">{feature.title}</H3>
                  <Small variant="muted">{feature.description}</Small>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="pt-4">
        <Button
          onClick={handleContinue}
          className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 flex w-full items-center justify-center gap-2 bg-gradient-to-r text-white shadow-lg"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
        </div>
        <Small variant="muted" className="mt-2">
          Step 4 of 6
        </Small>
      </div>
    </motion.div>
  );
}
