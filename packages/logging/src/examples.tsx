import { LoggerProvider, ConsoleLoggerFactory, CompositeLoggerFactory, RecordingLoggerFactory, useLogger } from "./index";
import { ReactNode } from "react";

export function ExampleWithConsoleLogger({ children }: { children: ReactNode }) {
  const factory = new ConsoleLoggerFactory();

  return <LoggerProvider factory={factory}>{children}</LoggerProvider>;
}

export function ExampleWithCompositeLogger({ children }: { children: ReactNode }) {
  const factory = new CompositeLoggerFactory([new ConsoleLoggerFactory(), new RecordingLoggerFactory()]);

  return <LoggerProvider factory={factory}>{children}</LoggerProvider>;
}

export function ExampleComponent() {
  const logger = useLogger("ExampleComponent");

  const handleClick = () => {
    logger.info("Button clicked");
    logger.debug("Additional debug info", { timestamp: Date.now() });
  };

  const handleError = () => {
    try {
      throw new Error("Something went wrong");
    } catch (error) {
      logger.error("Error occurred:", error);
    }
  };

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
      <button onClick={handleError}>Trigger error</button>
    </div>
  );
}

export function ExampleServiceClass() {
  const factory = new ConsoleLoggerFactory();
  const logger = factory.loggerFor("MyService");

  return {
    doSomething: () => {
      logger.info("Starting operation");
      logger.debug("Operation details", { id: 123 });
      logger.info("Operation completed");
    },

    handleError: (error: Error) => {
      logger.error("Operation failed:", error);
    },
  };
}
