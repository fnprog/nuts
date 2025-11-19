import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { H1, Muted } from "@/core/components/ui/typography";
import { Button } from "@/core/components/ui/button";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding.store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding/language")({
  component: RouteComponent,
});

const LANGUAGES = [
  { code: "en-US", name: "English", flag: "🇺🇸" },
  { code: "es-ES", name: "Español", flag: "🇪🇸" },
  { code: "fr-FR", name: "Français", flag: "🇫🇷" },
];

function RouteComponent() {
  const navigate = useNavigate();
  const storedLanguage = useOnboardingStore((state) => state.language);
  const setLanguage = useOnboardingStore((state) => state.setLanguage);
  const setStep = useOnboardingStore((state) => state.setStep);

  const [selectedLanguage, setSelectedLanguage] = useState(storedLanguage);

  const handleContinue = async () => {
    setLanguage(selectedLanguage);
    setStep(2);
    await navigate({ to: "/onboarding/currency" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-[calc(100vh-200px)] flex-col w-full max-w-md"
    >
      <div className="flex-1 space-y-8">
        <div className="space-y-3 text-center">
          <H1 className="text-3xl font-semibold">Choose your language</H1>
          <Muted className="text-base">Select your preferred language for the app</Muted>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-4",
                selectedLanguage === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="text-lg font-medium">{lang.name}</span>
            </button>
          ))}
        </motion.div>

        <Button
          variant="primary"
          onClick={handleContinue}
          className="w-full"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
