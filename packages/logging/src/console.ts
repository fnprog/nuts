import { BaseLogger } from "./base";
import type { Level, LoggerFactory, Logger } from "./types";
import { shouldLog } from "./local-storage-filter";

export class ConsoleLoggerFactory implements LoggerFactory {
  loggerFor(name: string): Logger {
    return new ConsoleLogger(name);
  }
}

export class ConsoleLogger extends BaseLogger {
  protected log(method: Level, ...args: unknown[]): string {
    if (!shouldLog(this.name, method)) {
      return "";
    }

    const log = console[method];
    const prefix = `[${this.name}]`;
    const [firstArg, ...rest] = args;

    if (typeof firstArg === "string") {
      log(`${prefix} ${firstArg}`, ...rest);
    } else {
      log(prefix, ...args);
    }

    return "";
  }
}
