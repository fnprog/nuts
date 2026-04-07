import type { Level, LoggerFactory, Logger } from "./types";

export interface LogRecord {
  level: Level;
  args: unknown[];
  timestamp: number;
}

export class RecordingLoggerFactory implements LoggerFactory {
  private readonly records: Map<string, LogRecord[]> = new Map();

  loggerFor(name: string): Logger {
    if (!this.records.has(name)) {
      this.records.set(name, []);
    }
    return new RecordingLogger(name, this.records.get(name)!);
  }

  getRecords(name: string): LogRecord[] {
    return this.records.get(name) || [];
  }

  getAllRecords(): Map<string, LogRecord[]> {
    return new Map(this.records);
  }

  clear(name?: string): void {
    if (name) {
      this.records.get(name)?.splice(0);
    } else {
      this.records.clear();
    }
  }
}

export class RecordingLogger implements Logger {
  private readonly name: string;
  private readonly records: LogRecord[];

  constructor(name: string, records: LogRecord[]) {
    this.name = name;
    this.records = records;
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

  private log(level: Level, ...args: unknown[]): string {
    this.records.push({
      level,
      args,
      timestamp: Date.now(),
    });

    return "";
  }
}
