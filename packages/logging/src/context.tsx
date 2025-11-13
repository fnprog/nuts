import { createContext, useContext, type ReactNode } from "react";
import type { Logger, LoggerFactory } from "./types";

const LoggerFactoryContext = createContext<LoggerFactory | undefined>(undefined);

export interface LoggerProviderProps {
  factory: LoggerFactory;
  children: ReactNode;
}

export function LoggerProvider({ factory, children }: LoggerProviderProps) {
  return <LoggerFactoryContext.Provider value={factory}>{children}</LoggerFactoryContext.Provider>;
}

export const useLogger = (name: string): Logger => {
  const factory = useContext(LoggerFactoryContext);

  if (!factory) {
    throw new Error("useLogger must be used within a LoggerProvider");
  }

  return factory.loggerFor(name);
};

export const useLoggerFactory = (): LoggerFactory => {
  const factory = useContext(LoggerFactoryContext);

  if (!factory) {
    throw new Error("useLoggerFactory must be used within a LoggerProvider");
  }

  return factory;
};
