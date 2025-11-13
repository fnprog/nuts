import React from "react";
import { useInit } from "@/core/hooks/use-init";
import { LoadingScreen } from "@/core/components/ui/loading-screen";

export const Initializer = ({ children }: React.PropsWithChildren) => {
  const { isInitializing, error } = useInit();

  if (error) {
    return (
      <LoadingScreen
        error={{
          title: "Initialization Failed",
          message: error.message,
          action: {
            label: "Retry",
            onClick: () => window.location.reload(),
          },
        }}
      />
    );
  }

  if (isInitializing) {
    return <LoadingScreen subtitle="Setting things up" />;
  }

  return <>{children}</>;
};
