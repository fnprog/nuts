import type { LoggerFactory, Logger } from "./types";

export class VoidLoggerFactory implements LoggerFactory {
  loggerFor(): Logger {
    return new VoidLogger();
  }
}

export class VoidLogger implements Logger {
  debug(): string {
    return "";
  }

  info(): string {
    return "";
  }

  warn(): string {
    return "";
  }

  error(): string {
    return "";
  }
}
