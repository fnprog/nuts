import { useState } from "react";
import { motion } from "motion/react";
import { type } from "@nuts/validation";

import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { H1, P, Small } from "@/core/components/ui/typography";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Nuts } from "@/core/components/icons/Logo";

const searchSchema = type({
  "redirect?": "string",
});

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search) => {
    const result = searchSchema(search);
    return result instanceof type.errors ? { redirect: "" } : result;
  },
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || "/dashboard/home" });
    }
  },
  shouldReload({ context }) {
    return !context.auth.isAuthenticated;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // Add your password reset logic here
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm space-y-8"
      >
        <motion.header initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center">
          <Nuts className="h-10 w-10" fill="var(--foreground)" />
        </motion.header>

        <main className="mt-4 w-full">
          <div className="space-y-1">
            <H1 className="text-center">Reset password</H1>
            <P className="text-center">Enter your email address and we'll send you a link to reset your password</P>
          </div>
          <div>
            {!isSubmitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    disabled={isLoading}
                    required
                    className="bg-white/50 backdrop-blur-sm transition-colors duration-300 focus:bg-white/80"
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    className="w-full bg-linear-to-br from-emerald-600 to-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-emerald-600 hover:shadow-emerald-600/25"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending link..." : "Send reset link"}
                  </Button>
                </motion.div>
              </form>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                <Small className="text-muted-foreground">
                  Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                </Small>
                <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                  Try again
                </Button>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 text-center">
              <Small className="text-muted-foreground">
                Remember your password?{" "}
                <Link to="/login" className="text-emerald-700 transition-colors hover:text-emerald-600">
                  Log in
                </Link>
              </Small>
            </motion.div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
