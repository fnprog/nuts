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

export const Route = createFileRoute("/(auth)/forgot-password")({
  validateSearch: (search) => {
    const result = searchSchema(search);
    return result instanceof type.errors ? { redirect: "" } : result;
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
      <div className="mb-8 lg:hidden">
        <div className="flex items-center gap-2">
          <Nuts className="h-8 w-8" fill="black" />
          <span className="text-2xl font-bold">Nuts</span>
        </div>
      </div>

      <main className="w-full">
        <div className="mb-8">
          <H1 className="mb-2 text-3xl font-bold">Reset password</H1>
          <P className="text-gray-600">Enter your email address and we'll send you a link to reset your password</P>
        </div>

        {!isSubmitted ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-3">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                disabled={isLoading}
                required
                className="rounded-lg border-gray-200 bg-gray-50 py-6 text-base placeholder:text-gray-400"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button
                type="submit"
                variant="mono"
                className="w-full rounded-lg py-6 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-4 text-center">
              <p className="text-sm text-gray-600">
                {"Remember your password? "}
                <Link to="/login" className="font-medium text-black hover:underline">
                  Log in
                </Link>
              </p>
            </motion.div>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-6">
              <p className="text-sm text-gray-600">
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-lg border-gray-200 py-6 text-base font-normal hover:bg-gray-50"
              onClick={() => setIsSubmitted(false)}
            >
              Try again
            </Button>
            <div className="pt-4 text-center">
              <p className="text-sm text-gray-600">
                {"Remember your password? "}
                <Link to="/login" className="font-medium text-black hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </motion.div>
  );
}
