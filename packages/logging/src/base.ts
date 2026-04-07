import type { Level, Logger } from "./types";

export abstract class BaseLogger<Args extends unknown[] = unknown[]> implements Logger<Args> {
  constructor(protected readonly name: string) {}

  debug(...args: Args): string {
    return this.log("debug", ...args);
  }

  info(...args: Args): string {
    return this.log("info", ...args);
  }

  warn(...args: Args): string {
    return this.log("warn", ...args);
  }

  error(...args: Args): string {
    return this.log("error", ...args);
  }

  protected abstract log(method: Level, ...args: Args): string;
}
