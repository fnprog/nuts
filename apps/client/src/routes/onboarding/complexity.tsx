import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/components/ui/button";
import { H2, P, H3, Small, Muted } from "@/core/components/ui/typography";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { userService } from "@/features/users/services/user.service";

export const Route = createFileRoute("/onboarding/complexity")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { firstName, lastName, setComplexFinance, completeOnboarding } = useOnboardingStore();

  const { data: user } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });

  const handleAnswer = async (feelsComplex: boolean) => {
    try {
      setComplexFinance(feelsComplex);

      // Update user's name in the backend if it's different
      if (user.first_name !== firstName || user.last_name !== lastName) {
        await userService.updateMe({
          first_name: firstName,
          last_name: lastName,
        });
      }

      // Mark onboarding as complete
      completeOnboarding();

      toast.success("Welcome to Nuts Finance! 🎉", {
        description: "Your account has been set up successfully.",
      });

      // Navigate to dashboard with replace to prevent back navigation to onboarding
      try {
        await navigate({ to: "/dashboard/home", replace: true });
      } catch (navError) {
        console.error("Navigation error, falling back to location change:", navError);
        // Fallback to direct navigation if router navigation fails
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
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="bg-primary-nuts-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <TrendingUp className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <H2>Do you feel like your finances have become more complex over time?</H2>
        <P variant="muted">This helps us understand how to best present your financial information.</P>
      </div>

      <div className="space-y-4 pt-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            onClick={() => handleAnswer(true)}
            className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 flex h-16 w-full flex-col items-start justify-center bg-linear-to-r px-6 text-left text-white shadow-lg"
          >
            <span className="font-medium">Yes, they've gotten more complex</span>
            <Small className="text-primary-nuts-100 mt-1">We'll provide detailed insights and organization tools</Small>
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={() => handleAnswer(false)}
            variant="outline"
            className="flex h-16 w-full flex-col items-start justify-center border-2 border-gray-200 bg-white px-6 text-left hover:border-gray-300 hover:bg-gray-50"
          >
            <span className="font-medium text-gray-900">No, they're fairly simple</span>
            <Muted className="mt-1">
              We'll focus on clean, simple overviews
            </Muted>
          </Button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-primary-nuts-50 border-primary-nuts-200 rounded-lg border p-4"
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="text-primary-nuts-600 h-6 w-6 shrink-0" />
          <div>
            <H3 className="text-primary-nuts-900">Almost done!</H3>
            <Small className="text-primary-nuts-700">After this question, you'll be ready to start managing your finances with Nuts.</Small>
          </div>
        </div>
      </motion.div>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
        </div>
        <Muted className="mt-2">
          Step 6 of 6
        </Muted>
      </div>
    </motion.div>
  );
}
