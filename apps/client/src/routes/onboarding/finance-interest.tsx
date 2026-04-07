import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { H1, Muted } from "@/core/components/ui/typography";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

import {
  Field
} from "@/core/components/ui/field"

export const Route = createFileRoute("/onboarding/finance-interest")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setBetterFinance, setStep, completeOnboarding } = useOnboardingStore();



  const handleBack = async () => {
    setStep(0);
    await navigate({ to: "/onboarding/name" });
  };

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
    await navigate({ to: "/dashboard/home" });
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
          <H1 className="font-semibold ">Do you want to better understand your personal finance?</H1>
          <Muted className="text-base ">We can help you gain insights into your spending patterns, savings goals, and financial health.</Muted>
        </div>

        <div className="space-y-4 pt-4">
          <Field>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* <Button variant="primary" onClick={handleYes} className="w-full bg-green-600 text-white hover:bg-green-700"> */}
              {/*   Yes, I want to learn more */}
              {/* </Button> */}
              <Button variant="primary" onClick={handleYes} className="w-full">
                Yes, I want to learn more
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Button onClick={handleNo} variant="outline" className="w-full border border-gray-300 bg-white hover:bg-gray-50">
                No, I'm already comfortable
              </Button>
            </motion.div>
          </Field>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center justify-between pt-8">
        <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSkip} variant="ghost" className="text-gray-600 hover:text-gray-900">
          Skip
        </Button>
      </motion.div>
    </motion.div>
  );
}
