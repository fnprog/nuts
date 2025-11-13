import { Nuts } from "@/core/components/icons/Logo";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  /**
   * Optional subtitle text to display below the logo
   */
  subtitle?: string;
  /**
   * Error state to display instead of loading animation
   */
  error?: {
    title: string;
    message?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  /**
   * Custom className for the container
   */
  className?: string;
}

export function LoadingScreen({ subtitle, error, className }: LoadingScreenProps) {
  if (error) {
    return (
      <div className={cn("bg-background flex min-h-screen flex-col items-center justify-center", className)}>
        <div className="flex max-w-md flex-col items-center space-y-6 px-6">
          {/* Error Icon - Static Logo with Error Color */}
          <div className="relative">
            <Nuts className="text-destructive h-24 w-24" fill="currentColor" />
          </div>

          {/* Error Title */}
          <div className="space-y-2 text-center">
            <h2 className="text-foreground text-2xl font-semibold">{error.title}</h2>
            {error.message && <p className="text-muted-foreground text-sm">{error.message}</p>}
          </div>

          {/* Error Action */}
          {error.action && (
            <button onClick={error.action.onClick} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-2 transition-colors">
              {error.action.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background flex min-h-screen flex-col items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-6">
        {/* Animated Logo */}
        <div className="relative">
          {/* Pulsing background circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 h-32 w-32 animate-ping rounded-full" style={{ animationDuration: "2s" }} />
          </div>

          {/* Rotating logo */}
          <div className="animate-spin-slow relative">
            <Nuts className="text-primary h-24 w-24" fill="currentColor" />
          </div>
        </div>

        {/* Subtitle */}
        {subtitle && <p className="text-muted-foreground animate-pulse text-sm">{subtitle}</p>}
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
