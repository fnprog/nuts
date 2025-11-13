import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Star, Users, ArrowRight } from "lucide-react";

import { Button } from "@/core/components/ui/button";
import { H2, P, Small } from "@/core/components/ui/typography";
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
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <div className="bg-primary-nuts-100 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Users className="text-primary-nuts-600 h-8 w-8" />
        </div>
        <H2>How Nuts has helped others</H2>
        <P variant="muted">Join thousands of users who have transformed their financial lives</P>
      </div>

      <div className="space-y-4 pt-2">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
            className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="bg-primary-nuts-100 flex h-10 w-10 items-center justify-center rounded-full">
                  <span className="text-primary-nuts-700 text-sm font-medium">{testimonial.name.charAt(0)}</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center space-x-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Small className="mb-2 text-gray-700">{testimonial.content}</Small>
                <Small variant="muted">
                  <span className="font-medium">{testimonial.name}</span>
                  <span className="mx-1">•</span>
                  <span>{testimonial.role}</span>
                </Small>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
        <Button
          onClick={handleContinue}
          className="from-primary-nuts-600 to-primary-nuts-700 hover:from-primary-nuts-700 hover:to-primary-nuts-800 flex w-full items-center justify-center gap-2 bg-gradient-to-r text-white shadow-lg"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      <div className="text-center">
        <div className="mt-6 flex justify-center space-x-2">
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="bg-primary-nuts-600 h-2 w-2 rounded-full"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          <div className="h-2 w-2 rounded-full bg-gray-300"></div>
        </div>
        <Small variant="muted" className="mt-2">
          Step 3 of 6
        </Small>
      </div>
    </motion.div>
  );
}
