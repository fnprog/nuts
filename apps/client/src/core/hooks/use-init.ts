import { useEffect, useState } from "react";
import { offlineFirstInitService } from "@/core/sync/init";

export interface Status {
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
}

export const useInit = (): Status => {
  const [status, setStatus] = useState<Status>({
    isInitialized: false,
    isInitializing: false,
    error: null,
  });

  useEffect(() => {
    const initializeServices = async () => {
      if (offlineFirstInitService.isReady()) {
        setStatus((prev) => ({
          ...prev,
          isInitialized: true,
        }));
        return;
      }

      setStatus((prev) => ({
        ...prev,
        isInitializing: true,
      }));

      try {
        await offlineFirstInitService.initialize();
        setStatus((prev) => ({
          ...prev,
          isInitialized: true,
          isInitializing: false,
          error: null,
        }));
      } catch (error) {
        setStatus((prev) => ({
          ...prev,
          isInitializing: false,
          error: error instanceof Error ? error : new Error("Unknown initialization error"),
        }));
      }
    };

    initializeServices();
  }, []);

  return status;
};
