import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "motion/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type } from "@nuts/validation";
import { arktypeResolver } from "@hookform/resolvers/arktype";

import { config } from "@/lib/env";
import { logger } from "@/lib/logger";
import { authService } from "@/features/auth/services/auth.service";
import { type SignupFormValues, signupSchema } from "@/features/auth/services/auth.types";
import { dataMigrationService } from "@/core/sync/data-migration";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

import { Separator } from "@/core/components/ui/separator";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Nuts } from "@/core/components/icons/Logo";
import { Google } from "@/core/components/icons/google";
import { Apple } from "@/core/components/icons/apple";
import { parseApiError } from "@/lib/error";

import { H1, Muted } from "@/core/components/ui/typography";

import {
  Field,
  FieldGroup,
  FieldError,
  FieldLabel,
  FieldDescription,
  FieldSet,
} from "@/core/components/ui/field"

const searchSchema = type({
  "redirect?": "string",
});

export const Route = createFileRoute("/(auth)/signup")({
  validateSearch: (search) => {
    const result = searchSchema(search);
    return result instanceof type.errors ? { redirect: "" } : result;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const setAnonymous = useAuthStore((s) => s.setAnonymous);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const onboardingName = useOnboardingStore((s) => s.name);

  const form = useForm<SignupFormValues>({
    resolver: arktypeResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  useEffect(() => {
    if (isAnonymous && onboardingName) {
      form.setValue("name", onboardingName);
    }
  }, [isAnonymous, onboardingName, form]);

  async function onSubmit(values: SignupFormValues) {
    try {
      setIsSubmitting(true);
      await authService.signup(values);

      toast.success("Account created successfully", {
        description: "You can now login into the system",
      });

      setIsMigrating(true);

      try {
        const migrationResult = await dataMigrationService.migrateAnonymousDataToAuthenticated();

        if (migrationResult.success) {
          const totalMigrated = migrationResult.migratedTransactions + migrationResult.migratedAccounts + migrationResult.migratedCategories;
          if (totalMigrated > 0) {
            toast.success(`Migrated ${totalMigrated} items from guest session`);
          }
        }
      } catch (error) {
        console.warn("Migration failed during signup, continuing:", error);
        toast.warning("Some guest data could not be migrated");
      } finally {
        setIsMigrating(false);
      }

      setAnonymous(false);

      await navigate({ to: "/login" });
    } catch (error) {
      const parsedErr = parseApiError(error);

      toast.error("Signup Failed", {
        description: parsedErr.userMessage,
      });

      logger.error(parsedErr.originalError, {
        component: "SignupForm",
        action: "onSubmit",
        parsedErrorType: parsedErr.type,
        parsedUserMessage: parsedErr.userMessage,
        validationErrors: parsedErr.validationErrors,
        statusCode: parsedErr.statusCode,
        axiosErrorCode: parsedErr.axiosErrorCode,
        attemptedEmail: values.email,
      });

      if (parsedErr.type === "validation" && parsedErr.validationErrors) {
        parsedErr.validationErrors.forEach((err) => {
          if (form.formState.defaultValues) {
            if (err.field in form.formState.defaultValues) {
              form.setError(err.field as keyof SignupFormValues, { message: err.message });
            }
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <div className="flex items-center gap-2">
          <Nuts className="h-8 w-8" fill="black" />
          <span className="text-2xl font-bold">Nuts</span>
        </div>
      </div>

      <main className="w-full">
        <div className="mb-8">
          <H1 className="mb-2 text-3xl font-bold">Create an account</H1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-3"
                    asChild
                  >
                    <a href={`${config.VITE_API_BASE_URL}/auth/oauth/apple`}>
                      <Apple className="size-5" fill="#000" />
                      <span>Login with Apple</span>
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full  gap-3 "
                    asChild
                  >
                    <a href={`${config.VITE_API_BASE_URL}/auth/oauth/google`}>
                      <Google className="size-5" />
                      <span>Login with Google</span>
                    </a>
                  </Button>
                </Field>
              </FieldGroup>

              <div className="relative ">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <Muted className="bg-white px-4 ">or</Muted>
                </div>
              </div>

              <FieldGroup className="gap-3">

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} >
                  <Field>
                    <FieldLabel className="sr-only hidden" htmlFor="username">Username</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email"
                      disabled={isMigrating || isSubmitting}
                      {...form.register("email")}
                    />
                    {form.formState.errors.email && <FieldError>{form.formState.errors.email.message}</FieldError>}
                  </Field>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} >
                  <Field>
                    <FieldLabel className="sr-only hidden" htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      disabled={isMigrating || isSubmitting}
                      {...form.register("password")}
                    />
                    {form.formState.errors.password && <FieldError>{form.formState.errors.password.message}</FieldError>}
                  </Field>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  <Field>
                    <Button
                      type="submit"
                      variant="mono"
                      className="w-full"
                      disabled={isSubmitting || isMigrating}
                    >
                      {isMigrating ? "Migrating data..." : isSubmitting ? "Creating account..." : "Create account"}
                    </Button>
                  </Field>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="pt-4 text-center">
                  <Field>
                    <FieldDescription >
                      {"Already have an account? "}
                      <Link to="/login" className="font-medium text-black hover:underline">
                        Login
                      </Link>
                    </FieldDescription>
                  </Field>
                </motion.div>
              </FieldGroup>
            </FieldSet>
          </FieldGroup >
        </form>
      </main>
    </motion.div>
  );
}
