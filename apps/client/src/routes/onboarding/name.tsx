import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { type } from "@nuts/validation";
import { motion } from "motion/react";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { H1, Muted } from "@/core/components/ui/typography";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/core/components/ui/field"
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { userService } from "@/features/users/services/user.service";
import { shouldSkipNameStep } from "@/features/onboarding/services/onboarding";
import { useAuthStore } from "@/features/auth/stores/auth.store";

const nameSchema = type({
  name: "string>=1",
}).narrow((data, ctx) => {
  if (data.name.length > 100) {
    return ctx.reject({ path: ["name"], message: "Name must be at most 100 characters" });
  }
  return true;
});

type NameFormValues = typeof nameSchema.infer;

export const Route = createFileRoute("/onboarding/name")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const name = useOnboardingStore((state) => state.name)
  const isAnonymous = useAuthStore((state) => state.isAnonymous)
  const setName = useOnboardingStore((state) => state.setName)
  const setStep = useOnboardingStore((state) => state.setStep)


  console.log("isAnon: ", isAnonymous)

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => userService.getMe().unwrapOr(undefined),
  });

  const form = useForm<NameFormValues>({
    resolver: arktypeResolver(nameSchema),
    defaultValues: {
      name: name || "",
    },
  });

  useEffect(() => {
    if (user && shouldSkipNameStep(user)) {
      setName(user.name || "");
      setStep(1);
      navigate({ to: "/onboarding/finance-interest" });
    }
  }, [user, setName, setStep, navigate]);

  const onSubmit = async (values: NameFormValues) => {
    setName(values.name);
    setStep(1);
    await navigate({ to: "/onboarding/finance-interest" });
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
          <H1 className="text-3xl font-semibold ">Welcome! What's your name?</H1>
          <Muted className="text-base">We'll use this to personalize your experience.</Muted>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel className="sr-only hidden text-gray-700" htmlFor="name">Username</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className=""
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
                </Field>
                <Field>
                  <Button
                    variant="primary"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={form.formState.isSubmitting}
                  >
                    Continue
                  </Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
}
