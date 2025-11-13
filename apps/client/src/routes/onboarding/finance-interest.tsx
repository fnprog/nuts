import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { TrendingUp, SkipForward } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { H2, P, Small } from "@/core/components/ui/typography";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

export const Route = createFileRoute("/onboarding/finance-interest")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setBetterFinance, setStep, completeOnboarding } = useOnboardingStore();

  const handleYes = async () => {
    setBetterFinance(true);
    setStep(2);
    await navigate({ to: "/onboarding/social-proof" });
  };

  const handleNo = async () => {
    setBetterFinance(false);
    setStep(2);
    await navigate({ to: "/onboarding/social-proof" });
  };

  const handleSkip = async () => {
    setBetterFinance(null);

    completeOnboarding();
    // Skip to dashboard - they don't want to learn about finances
    await navigate({ to: "/dashboard/home" });
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
          <TrendingUp className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Do you want to better understand your personal finance?</h2>
        <p className="text-gray-600">We can help you gain insights into your spending patterns, savings goals, and financial health.</p>
      </div>

      <div className="space-y-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            onClick={handleYes}
            className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 h-12 w-full bg-gradient-to-r text-white shadow-lg"
          >
            Yes, I want to learn more
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={handleNo} variant="outline" className="h-12 w-full border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50">
            No, I'm already comfortable
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-2">
          <Button onClick={handleSkip} variant="ghost" className="flex w-full items-center justify-center gap-2 text-gray-500 hover:text-gray-700">
            <SkipForward className="h-4 w-4" />
            Skip onboarding
          </Button>
        </motion.div>
      </div>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
        </div>
        <Small variant="muted" className="mt-2">
          Step 2 of 6
        </Small>
      </div>
    </motion.div>
  );
}
