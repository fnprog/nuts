import { Button } from "@/core/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import LogoWTXT from "@/core/components/icons/NUTSNEW";

interface EmptyStateGuideProps {
  Icon: LucideIcon;
  title: string;
  children?: ReactNode;
  description: string;
  ctaText?: string;
  ctaTarget?: string; // Optional route to navigate to
  ctaSearch?: Record<string, unknown>; // Optional search params
  onCtaClick?: () => void; // Optional custom click handler
}

export function EmptyStateGuide({ title, children, description, ctaText, ctaTarget = "/dashboard/accounts", ctaSearch, onCtaClick }: EmptyStateGuideProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (ctaTarget) {
      navigate({ to: ctaTarget, search: ctaSearch });
    }
  };

  return (
    // This is the full-screen overlay
    <div className="bg-background/60 absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xs">
      <div className="bg-card flex w-full max-w-[80%] flex-col items-center rounded-xl border p-8 text-center shadow-lg md:max-w-md">
        <div className="bg-background mb-4 flex h-14 w-14 items-center justify-center rounded-full border">
          <LogoWTXT frontFill="var(--color-background)" fill="color-mix(in oklab, var(--color-muted-foreground) 50%, transparent)" className=" size-8" />
          {/* <Icon className="text-primary h-8 w-8" /> */}
        </div>
        <h2 className="text-md text-card-foreground font-semibold md:text-xl">{title}</h2>
        <p className="text-muted-foreground mt-2 text-xs md:text-sm">{description}</p>
        {children ? (
          children
        ) : (
          <Button onClick={handleClick} className="mt-6">
            {ctaText}
          </Button>
        )}
      </div>
    </div>
  );
}
