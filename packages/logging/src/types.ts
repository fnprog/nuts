export type Level = "debug" | "info" | "warn" | "error";

export interface Logger<Args extends unknown[] = unknown[]> {
  debug(...args: Args): string;
  info(...args: Args): string;
  warn(...args: Args): string;
  error(...args: Args): string;
}

export interface LoggerFactory {
  loggerFor(name: string): Logger;
}
