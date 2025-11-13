import React from "react";
import MonoConnect from "@mono.co/connect.js";
import { logger } from "@/lib/logger";

interface MonoCustomer {
  id?: string;
  name?: string;
  email?: string;
  identity?: {
    type: string;
    number: string;
  };
}

interface UseMomoProps {
  key: string;
  customer?: MonoCustomer;
  onSuccess?: (payload: { code: string }) => void;
  onLoad?: () => void;
  onClose?: () => void;
  onEvent?: (eventName: string, eventData: unknown) => void;
}

interface MonoContext {
  authMethod: string;
  institution: {
    id: string;
    name: string;
  };
  reference: string;
  timestamp: number;
}

interface useMonoReturn {
  openMono: () => void;
  reauthoriseAccount: (accountId: string) => void;
  isWidgetLoading: boolean;
  isMonoReady: boolean;
  context: MonoContext;
}

export function useMono({ key, customer, onSuccess, onLoad, onClose, onEvent }: UseMomoProps): useMonoReturn {
  const [isWidgetLoading, setIsWidgetLoading] = React.useState(false);
  const [context, setContext] = React.useState<MonoContext>({
    authMethod: "",
    institution: {
      id: "",
      name: "",
    },
    reference: "",
    timestamp: 0,
  });

  const monoInstance = React.useMemo(() => {
    if (!key) return null;

    const config: any = {
      key: key,
      onSuccess: (payload: { code: string }) => {
        setIsWidgetLoading(false);
        if (onSuccess) onSuccess(payload);
      },
      onLoad: () => {
        if (onLoad) onLoad();
      },
      onClose: () => {
        setIsWidgetLoading(false);
        if (onClose) onClose();
      },
      onEvent: (eventName: string, eventData: unknown) => {
        logger.debug(`Mono event: ${eventName}`, {
          data: eventData,
        });

        if (eventName === "INSTITUTION_SELECTED") {
          setContext(eventData as MonoContext);
        }

        if (onEvent) onEvent(eventName, eventData);
      },
    };

    if (customer) {
      config.data = { customer };
    }

    const connectInstance = new MonoConnect(config);
    return connectInstance;
  }, [onSuccess, onLoad, onClose, onEvent, key, customer]); // Dependencies for callbacks

  const openMono = React.useCallback(() => {
    if (!monoInstance) {
      console.error("Mono instance not initialized. Check public key.");
      return;
    }
    setIsWidgetLoading(true);

    monoInstance.setup(); // Call setup for new linking
    monoInstance.open();
  }, [monoInstance]);

  const reauthoriseAccount = React.useCallback(
    (accountId: string) => {
      if (!monoInstance) {
        console.error("Mono instance not initialized. Check public key.");
        return;
      }
      if (!accountId) {
        console.error("Account ID is required for re-authorisation.");
        return;
      }
      setIsWidgetLoading(true);

      monoInstance.reauthorise(accountId); // Call reauthorise for existing accounts
      monoInstance.open();
    },
    [monoInstance]
  );

  return {
    openMono,
    reauthoriseAccount,
    context,
    isWidgetLoading,
    isMonoReady: !!monoInstance, // To check if Mono could be initialized
  };
}
