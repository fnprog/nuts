import type { LoggerFactory, Logger } from "./types";

export class SampledLoggerFactory implements LoggerFactory {
  private readonly targetFactory: LoggerFactory;
  private readonly sampleRate: number;

  constructor(targetFactory: LoggerFactory, sampleRate: number) {
    this.targetFactory = targetFactory;
    this.sampleRate = Math.max(0, Math.min(1, sampleRate));
  }

  loggerFor(name: string): Logger {
    return new SampledLogger(this.targetFactory.loggerFor(name), this.sampleRate);
  }
}

export class SampledLogger implements Logger {
  private readonly target: Logger;
  private readonly sampleRate: number;

  constructor(target: Logger, sampleRate: number) {
    this.target = target;
    this.sampleRate = sampleRate;
  }

  debug(...args: unknown[]): string {
    if (Math.random() < this.sampleRate) {
      return this.target.debug(...args);
    }
    return "";
  }

  info(...args: unknown[]): string {
    if (Math.random() < this.sampleRate) {
      return this.target.info(...args);
    }
    return "";
  }

  warn(...args: unknown[]): string {
    if (Math.random() < this.sampleRate) {
      return this.target.warn(...args);
    }
    return "";
  }

  error(...args: unknown[]): string {
    if (Math.random() < this.sampleRate) {
      return this.target.error(...args);
    }
    return "";
  }
}
