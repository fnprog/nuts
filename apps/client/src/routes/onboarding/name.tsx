import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { type } from "@nuts/validation";
import { motion } from "motion/react";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { userService } from "@/features/users/services/user.service";
import { shouldSkipNameStep } from "@/features/onboarding/services/onboarding";
import { H2, P, Small } from "@/core/components/ui/typography";

const nameSchema = type({
  firstName: "string>=1",
  lastName: "string>=1",
}).narrow((data, ctx) => {
  if (data.firstName.length > 50) {
    return ctx.reject({ path: ["firstName"], message: "First name must be at most 50 characters" });
  }
  if (data.lastName.length > 50) {
    return ctx.reject({ path: ["lastName"], message: "Last name must be at most 50 characters" });
  }
  return true;
});

type NameFormValues = typeof nameSchema.infer;

export const Route = createFileRoute("/onboarding/name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const firstName = useOnboardingStore((state) => state.firstName)
  const lastName = useOnboardingStore((state) => state.lastName)
  const setName = useOnboardingStore((state) => state.setName)
  const setStep = useOnboardingStore((state) => state.setStep)


  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });

  const form = useForm<NameFormValues>({
    resolver: arktypeResolver(nameSchema),
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
    },
  });

  // Check if user already has names from OAuth and redirect to next step
  useEffect(() => {
    if (user && shouldSkipNameStep(user)) {
      // Auto-populate the store with their existing names
      setName(user.first_name || "", user.last_name || "");
      setStep(1);
      navigate({ to: "/onboarding/finance-interest" });
    }
  }, [user, setName, setStep, navigate]);

  const onSubmit = async (values: NameFormValues) => {
    setName(values.firstName, values.lastName);
    setStep(1);
    await navigate({ to: "/onboarding/finance-interest" });
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
          <User className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <H2 className="text-gray-900">What should we call you?</H2>
        <P className="text-gray-600">We'll use this information to personalize your experience and update your account.</P>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            className="focus:border-primary-nuts-400 focus:ring-primary-nuts-400 border-gray-200 bg-white/80"
            {...form.register("firstName")}
          />
          {form.formState.errors.firstName && <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            className="focus:border-primary-nuts-400 focus:ring-primary-nuts-400 border-gray-200 bg-white/80"
            {...form.register("lastName")}
          />
          {form.formState.errors.lastName && <Small className="text-red-500">{form.formState.errors.lastName.message}</Small>}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-4">
          <Button
            type="submit"
            className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 w-full bg-linear-to-r text-white shadow-lg"
            disabled={form.formState.isSubmitting}
          >
            Continue
          </Button>
        </motion.div>
      </form>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
        </div>
        <Small className="mt-2 text-gray-500">Step 1 of 6</Small>
      </div>
    </motion.div>
  );
}
