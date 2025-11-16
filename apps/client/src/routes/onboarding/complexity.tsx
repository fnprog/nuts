import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { H1, Muted } from "@/core/components/ui/typography";
import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { userService } from "@/features/users/services/user.service";

export const Route = createFileRoute("/onboarding/complexity")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const name = useOnboardingStore((state) => state.name);
  const setComplexFinance = useOnboardingStore((state) => state.setComplexFinance);
  const setStep = useOnboardingStore((state) => state.setStep);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);

  const { data: user } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: () => userService.getMe().unwrapOr(undefined),
  });

  const handleBack = async () => {
    setStep(4);
    await navigate({ to: "/onboarding/features" });
  };

  const handleAnswer = async (feelsComplex: boolean) => {
    try {
      setComplexFinance(feelsComplex);

      if (user && user.name !== name) {
        await userService.updateMe({
          name: name,
        });
      }

      completeOnboarding();

      toast.success("Welcome to Nuts Finance!", {
        description: "Your account has been set up successfully.",
      });

      try {
        await navigate({ to: "/dashboard/home", replace: true });
      } catch (navError) {
        console.error("Navigation error, falling back to location change:", navError);
        window.location.href = "/dashboard/home";
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "We couldn't save your information. Please try again.",
      });
      console.error("Onboarding completion error:", error);
    }
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
          <H1 className="text-3xl font-semibold ">Do you feel like your finances have become more complex over time?</H1>
          <Muted className="text-base">This helps us understand how to best present your financial information.</Muted>
        </div>

        <div className="space-y-4 pt-4">
          <Muted className="mt-1 ">We'll provide detailed insights and organization tools</Muted>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Button onClick={() => handleAnswer(true)} variant="primary" className="w-full" >
              <span className="font-medium">Yes, they've gotten more complex</span>
            </Button>
          </motion.div>

          <Muted className="mt-1 ">We'll focus on clean, simple overviews</Muted>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Button
              onClick={() => handleAnswer(false)}
              variant="outline"
              className="flex h-16 w-full flex-col items-start justify-center border border-gray-300 bg-white px-6 text-left hover:bg-gray-50"
            >
              No, they're fairly simple
            </Button>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-between pt-8">
        <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </motion.div>
    </motion.div>
  );
}
