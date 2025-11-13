import type { Level, LoggerFactory, Logger } from "./types";

interface LogEntry {
  method: Level;
  args: unknown[];
}

export class DeferredLoggerFactory implements LoggerFactory {
  private readonly targetFactory: LoggerFactory;

  constructor(targetFactory: LoggerFactory) {
    this.targetFactory = targetFactory;
  }

  loggerFor(name: string): Logger {
    return new DeferredLogger(name, this.targetFactory);
  }
}

export class DeferredLogger implements Logger {
  private readonly name: string;
  private readonly targetFactory: LoggerFactory;
  private readonly queue: LogEntry[] = [];
  private target: Logger | null = null;

  constructor(name: string, targetFactory: LoggerFactory) {
    this.name = name;
    this.targetFactory = targetFactory;
  }

  flush(): void {
    if (this.target) {
      return;
    }

    this.target = this.targetFactory.loggerFor(this.name);

    for (const entry of this.queue) {
      this.target[entry.method](...entry.args);
    }

    this.queue.length = 0;
  }

  debug(...args: unknown[]): string {
    return this.log("debug", ...args);
  }

  info(...args: unknown[]): string {
    return this.log("info", ...args);
  }

  warn(...args: unknown[]): string {
    return this.log("warn", ...args);
  }

  error(...args: unknown[]): string {
    return this.log("error", ...args);
  }

  private log(method: Level, ...args: unknown[]): string {
    if (this.target) {
      this.target[method](...args);
    } else {
      this.queue.push({ method, args });
    }

    return "";
  }
}
