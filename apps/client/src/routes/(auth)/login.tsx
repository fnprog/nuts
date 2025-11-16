import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "motion/react";
import { type } from "@nuts/validation";

import { config } from "@/lib/env";
import { logger } from "@/lib/logger";
import { parseApiError } from "@/lib/error";
import { type LoginFormValues, loginSchema } from "@/features/auth/services/auth.types";
import { userService } from "@/features/users/services/user.service";
import { isOnboardingRequired, getOnboardingEntryPoint } from "@/features/onboarding/services/onboarding";
import { dataMigrationService } from "@/core/sync/data-migration";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Separator } from "@/core/components/ui/separator";
import { Nuts } from "@/core/components/icons/Logo";
import { Google } from "@/core/components/icons/google";
import { Apple } from "@/core/components/icons/apple";
import { useLogin } from "@/features/auth/services/auth.mutations";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/core/components/ui/input-otp";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { arktypeResolver } from "@hookform/resolvers/arktype";
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


//TODO: Change the button components to match the style here
//TODO: Change the Signup and Change password page to match the design

export const Route = createFileRoute("/(auth)/login")({
  validateSearch: (search) => {
    const result = searchSchema(search);
    return result instanceof type.errors ? { redirect: "" } : result;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const loginMutation = useLogin();
  const router = useRouter();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const setAnonymous = useAuthStore((s) => s.setAnonymous);

  const form = useForm<LoginFormValues>({
    resolver: arktypeResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  //TODO: Move on to use the result type for migrateAnonymousData function
  async function onSubmit(values: LoginFormValues) {
    try {
      const result = await loginMutation.mutateAsync(values);

      if (result.twoFactorRequired) {
        setIsTwoFactorStep(true);
        toast.info("Please enter your 2FA code to continue.");
        return;
      }

      toast.success("Welcome to your account 👋");

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
        logger.warn("Migration failed, continuing with login:", error);
        toast.warning("Some guest data could not be migrated");
      } finally {
        setIsMigrating(false);
      }

      setAnonymous(false);

      await router.invalidate();
      const userResult = await userService.getMe();

      userResult.match(
        (user) => {
          if (isOnboardingRequired(user)) {
            const entryPoint = getOnboardingEntryPoint(user);
            navigate({ to: entryPoint });
            return;
          }
        },
        (error) => {
          logger.error("Failed to check onboarding status", { error });
        }
      );

      await navigate({ to: search.redirect || "/dashboard/home" });
    } catch (error) {
      const parsedErr = parseApiError(error);

      toast.error("There was a problem logging you in", {
        description: parsedErr.userMessage,
      });

      logger.error(parsedErr.originalError, {
        component: "LoginForm",
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
              form.setError(err.field as keyof LoginFormValues, { message: err.message });
            }
          }
        });
      }
    }
  }

  async function onLoginLater() {
    const { anonymousUserService } = await import("@/features/auth/services/anonymous-user.service");
    const anonymousResult = await anonymousUserService.initialize();

    if (anonymousResult.isErr()) {
      toast.error("Failed to initialize anonymous session");
      logger.error("Failed to initialize anonymous user", { error: anonymousResult.error });
      return;
    }

    setAnonymous(true);
    await router.invalidate();
    await navigate({ to: "/onboarding/name" });
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
          <H1 className="mb-2 text-3xl font-bold">{isTwoFactorStep ? "Enter 2FA Code" : "Login"}</H1>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <FieldSet>
              {!isTwoFactorStep ? (
                <>
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
                          disabled={loginMutation.isPending}
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
                          disabled={loginMutation.isPending}
                          {...form.register("password")}
                        />
                        {form.formState.errors.password && <FieldError>{form.formState.errors.password.message}</FieldError>}
                      </Field>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                      <Field>
                        <Button
                          type="submit"
                          variant="mono"
                          className="w-full"
                          disabled={loginMutation.isPending || isMigrating}
                        >
                          {isMigrating ? "Migrating data..." : loginMutation.isPending ? "Verifying..." : "Login"}
                        </Button>
                      </Field>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3 pt-4 text-center">
                      <Field>
                        <FieldDescription >
                          {"Don't have an account? "}
                          <Link to="/signup" className="font-medium text-black hover:underline">
                            Sign up
                          </Link>
                        </FieldDescription>
                        <p className="text-sm text-gray-600">
                          {"or "}
                          <button
                            type="button"
                            onClick={onLoginLater}
                            className="font-medium text-black hover:underline"
                          >
                            Continue Without Account
                          </button>
                        </p>
                      </Field>
                    </motion.div>
                  </FieldGroup>
                </>
              ) : (

                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="twoFactorCode" className="sr-only">
                        2FA Code
                      </FieldLabel>
                      <Controller
                        control={form.control}
                        name="two_fa_code"
                        render={({ field }) => (
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        )}
                      />
                      {form.formState.errors.two_fa_code && <FieldError>{form.formState.errors.two_fa_code.message}</FieldError>}
                    </Field>
                    <Field>
                      <Button
                        type="submit"
                        variant="mono"
                        className="w-full"
                        loading={loginMutation.isPending || isMigrating}
                        disabled={loginMutation.isPending || isMigrating}
                      >
                        {isMigrating ? "Migrating data" : loginMutation.isPending ? "Verifying" : "Verify Code"}
                      </Button>
                    </Field>
                  </FieldGroup>
                </motion.div>
              )}
            </FieldSet>
          </FieldGroup>
        </form>
      </main>
    </motion.div>
  );
}
