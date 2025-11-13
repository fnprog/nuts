import type { LoggerFactory, Logger } from "./types";

export class CompositeLoggerFactory implements LoggerFactory {
  private readonly factories: LoggerFactory[];

  constructor(factories: LoggerFactory[]) {
    this.factories = factories;
  }

  loggerFor(name: string): Logger {
    return new CompositeLogger(this.factories.map((factory) => factory.loggerFor(name)));
  }
}

export class CompositeLogger implements Logger {
  private readonly loggers: Logger[];

  constructor(loggers: Logger[]) {
    this.loggers = loggers;
  }

  debug(...args: unknown[]): string {
    return this.callAll("debug", args);
  }

  info(...args: unknown[]): string {
    return this.callAll("info", args);
  }

  warn(...args: unknown[]): string {
    return this.callAll("warn", args);
  }

  error(...args: unknown[]): string {
    return this.callAll("error", args);
  }

  private callAll(method: "debug" | "info" | "warn" | "error", args: unknown[]): string {
    for (const logger of this.loggers) {
      logger[method](...args);
    }

    return "";
  }
}
