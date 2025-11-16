import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star, ArrowLeft } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { H1, Muted } from "@/core/components/ui/typography";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";

const testimonials = [
  {
    name: "Sarah M.",
    role: "Marketing Manager",
    content: "Nuts helped me reduce my expenses by 30% in just 3 months. The insights are incredible!",
    rating: 5,
  },
  {
    name: "James L.",
    role: "Software Engineer",
    content: "Finally, a financial app that actually makes sense. I can see where my money goes.",
    rating: 5,
  },
  {
    name: "Maria R.",
    role: "Teacher",
    content: "The goal tracking feature motivated me to save for my dream vacation. Made it in 6 months!",
    rating: 5,
  },
];

export const Route = createFileRoute("/onboarding/social-proof")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { setStep } = useOnboardingStore();

  const handleBack = async () => {
    setStep(1);
    await navigate({ to: "/onboarding/finance-interest" });
  };

  const handleContinue = async () => {
    setStep(3);
    await navigate({ to: "/onboarding/features" });
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
          <H1 className="font-semibold">How Nuts has helped others</H1>
          <Muted className="text-base">Join thousands of users who have transformed their financial lives</Muted>
        </div>

        <div className="space-y-4 pt-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.1 }}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start space-x-3">
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-sm font-medium text-gray-700">{testimonial.name.charAt(0)}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center space-x-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-2 text-sm text-gray-700">{testimonial.content}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">{testimonial.name}</span>
                    <span className="mx-1">•</span>
                    <span>{testimonial.role}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex items-center justify-between pt-8">
        <Button onClick={handleBack} variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button variant="primary" onClick={handleContinue} className=" px-8">
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
