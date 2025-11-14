import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
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

import { AtSignIcon, Lock } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Separator } from "@/core/components/ui/separator";
import { Nuts } from "@/core/components/icons/Logo";
import { Google } from "@/core/components/icons/google";
import { Apple } from "@/core/components/icons/apple";
import { useLogin } from "@/features/auth/services/auth.mutations";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/core/components/ui/input-otp";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { H1, Muted, P, Small } from "@/core/components/ui/typography";

const searchSchema = type({
  "redirect?": "string",
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => {
    const result = searchSchema(search);
    return result instanceof type.errors ? { redirect: "" } : result;
  },
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated || context.auth.isAnonymous) {
      throw redirect({ to: search.redirect || "/dashboard/home" });
    }
  },
  shouldReload({ context }) {
    return !context.auth.isAuthenticated;
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
        console.warn("Migration failed, continuing with login:", error);
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
    setAnonymous(true);
    await router.invalidate();
    await navigate({ to: search.redirect || "/dashboard/home" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-sm">
        <motion.header initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
          <Nuts className="h-10 w-10" fill="var(--foreground)" />
        </motion.header>

        <main className="mt-4 w-full">
          <div className="space-y-1">
            <H1>{isTwoFactorStep ? "Enter 2FA Code" : "Login to Nuts Finance"}</H1>
            <P variant="muted">
              {isTwoFactorStep ? "Enter the 6-digit code from your authenticator app." : "Manage your finance effortlessly with nuts finance"}
            </P>
          </div>
          <div className="mt-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isTwoFactorStep ? (
                <>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                    <Label htmlFor="email" className="sr-only">
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Email address"
                        disabled={loginMutation.isPending}
                        className="peer bg-white/50 ps-9 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80"
                        {...form.register("email")}
                      />
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                        <AtSignIcon size={16} aria-hidden="true" />
                      </div>
                    </div>
                    {form.formState.errors.email && <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>}
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-2">
                    <Label htmlFor="password" className="sr-only">
                      Password
                    </Label>

                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="Password"
                        disabled={loginMutation.isPending}
                        className="peer bg-white/50 ps-9 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80"
                        {...form.register("password")}
                      />
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                        <Lock size={16} aria-hidden="true" />
                      </div>
                    </div>
                    {form.formState.errors.password && <Small className="text-red-500">{form.formState.errors.password.message}</Small>}
                  </motion.div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2 text-center">
                  <Label htmlFor="twoFactorCode" className="sr-only">
                    2FA Code
                  </Label>
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
                  {form.formState.errors.two_fa_code && <Small className="text-red-500">{form.formState.errors.two_fa_code.message}</Small>}
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit"
                  className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-500 hover:to-primary-nuts-600 hover:shadow-primary-nuts-600/25 w-full bg-linear-to-br shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  disabled={loginMutation.isPending || isMigrating}
                >
                  {isMigrating ? "Migrating data..." : loginMutation.isPending ? "Verifying..." : isTwoFactorStep ? "Verify Code" : "Login"}
                </Button>
              </motion.div>

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <Muted>or authorize with</Muted>
                <Separator className="flex-1" />
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="grid gap-2 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="relative w-full gap-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={loginMutation.isPending}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/google`}>
                    <Google className="mr-2 h-2 w-2" />
                    Google
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="relative w-full gap-0 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 after:absolute after:inset-0 after:rounded-md after:opacity-0 after:transition-opacity after:duration-300 after:[background:linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_100%)] hover:bg-white/95 hover:shadow-[0_3px_6px_rgba(0,0,0,0.2)] hover:after:opacity-100"
                  disabled={loginMutation.isPending}
                  asChild
                >
                  <a href={`${config.VITE_API_BASE_URL}/auth/oauth/github`}>
                    <Apple className="mr-2 h-2 w-2" fill="#000" />
                    Apple
                  </a>
                </Button>
              </motion.div>

              {!isTwoFactorStep && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <Small>
                      <Link to="/forgot-password" className="text-primary-nuts-700 hover:text-primary-nuts-600 transition-colors">
                        Forgot password?
                      </Link>
                    </Small>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="button" variant="outline" className="w-full" onClick={onLoginLater}>
                      Continue Without Account
                    </Button>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <Muted>
                      {"Don't have an account? "}
                      <Link to="/signup" className="text-primary-nuts-700 hover:text-primary-nuts-600 transition-colors">
                        Sign up
                      </Link>
                    </Muted>
                  </motion.div>
                </>
              )}
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
