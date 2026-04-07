# Logging Package

A flexible, production-ready logging system for the Nuts client application.

## Features

- **Multiple Logger Types**: Console, Void, Composite, Deferred, Recording, and Sampled loggers
- **Environment-aware**: Different default behavior for development vs production
- **LocalStorage Filtering**: Control log levels dynamically via `localStorage.nutsLog`
- **React Integration**: Context-based logger access with hooks
- **Type-safe**: Full TypeScript support
- **Zero dependencies**: No external logging libraries required

## Quick Start

### 1. Setup Logger Provider

Wrap your app with the `LoggerProvider`:

```tsx
import { LoggerProvider, ConsoleLoggerFactory } from "@/lib/logging";

function App() {
  return (
    <LoggerProvider factory={new ConsoleLoggerFactory()}>
      <YourApp />
    </LoggerProvider>
  );
}
```

### 2. Use Logger in Components

```tsx
import { useLogger } from "@/lib/logging";

function MyComponent() {
  const logger = useLogger("MyComponent");

  const handleClick = () => {
    logger.info("Button clicked");
    logger.debug("Additional debug info", { userId: 123 });
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Logger Types

### ConsoleLogger

Standard console output with filtering support:

```tsx
import { ConsoleLoggerFactory } from "@/lib/logging";

const factory = new ConsoleLoggerFactory();
const logger = factory.loggerFor("MyService");

logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message");
```

### VoidLogger

Suppresses all log output (useful for tests):

```tsx
import { VoidLoggerFactory } from "@/lib/logging";

const factory = new VoidLoggerFactory();
```

### CompositeLogger

Combines multiple loggers:

```tsx
import { CompositeLoggerFactory, ConsoleLoggerFactory, RecordingLoggerFactory } from "@/lib/logging";

const factory = new CompositeLoggerFactory([
  new ConsoleLoggerFactory(),
  new RecordingLoggerFactory(),
]);
```

### DeferredLogger

Queues logs until flushed (useful for early initialization):

```tsx
import { DeferredLoggerFactory, ConsoleLoggerFactory } from "@/lib/logging";

const factory = new DeferredLoggerFactory(new ConsoleLoggerFactory());
const logger = factory.loggerFor("EarlyInit");

logger.info("This will be queued");

(logger as DeferredLogger).flush();
```

### RecordingLogger

Captures logs for inspection (useful for testing):

```tsx
import { RecordingLoggerFactory } from "@/lib/logging";

const factory = new RecordingLoggerFactory();
const logger = factory.loggerFor("Test");

logger.info("Test message");

const records = factory.getRecords("Test");
console.log(records);

factory.clear("Test");
```

### SampledLogger

Only logs a percentage of messages (useful for high-frequency logs):

```tsx
import { SampledLoggerFactory, ConsoleLoggerFactory } from "@/lib/logging";

const factory = new SampledLoggerFactory(new ConsoleLoggerFactory(), 0.1);
```

## Log Filtering

Control which logs are displayed using `localStorage.nutsLog`:

### Format

```
NAME=LEVEL,NAME2=LEVEL2,...
```

### Levels

- `*` or `debug` - All logs (debug, info, warn, error)
- `info` - Info, warn, and error
- `warn` - Warn and error only
- `error` - Error only
- `off` or `` (empty) - No logs

### Examples

```js
localStorage.nutsLog = "*=*";

localStorage.nutsLog = "*=info,MyComponent=off";

localStorage.nutsLog = "AccountService=error,TransactionService=warn";

localStorage.nutsLog = "SyncEngine=debug";

delete localStorage.nutsLog;
```

### Default Behavior

- **Development**: All logs enabled (`*=*`)
- **Production**: No logs unless specified in localStorage

## Advanced Usage

### Custom Logger

Create your own logger by extending `BaseLogger`:

```tsx
import { BaseLogger, type Level } from "@/lib/logging";

export class CustomLogger extends BaseLogger {
  protected log(method: Level, ...args: unknown[]): string {
    return "";
  }
}
```

### Multiple Factories

Use different logger factories for different parts of your app:

```tsx
import { CompositeLoggerFactory, ConsoleLoggerFactory, RecordingLoggerFactory } from "@/lib/logging";

const devFactory = new CompositeLoggerFactory([
  new ConsoleLoggerFactory(),
  new RecordingLoggerFactory(),
]);

const prodFactory = new ConsoleLoggerFactory();

const factory = import.meta.env.DEV ? devFactory : prodFactory;
```

## Testing

Use `VoidLogger` or `RecordingLogger` in tests:

```tsx
import { describe, it, expect } from "vitest";
import { RecordingLoggerFactory } from "@/lib/logging";

describe("MyComponent", () => {
  it("logs correctly", () => {
    const factory = new RecordingLoggerFactory();
    const logger = factory.loggerFor("Test");

    logger.info("Test message");

    const records = factory.getRecords("Test");
    expect(records).toHaveLength(1);
    expect(records[0].level).toBe("info");
  });
});
```

## Migration from Old Logger

Old code:

```tsx
import { logger } from "@/lib/logger";

logger.info("Message", { context: "data" });
logger.error(new Error("Oops"));
```

New code:

```tsx
import { useLogger } from "@/lib/logging";

function MyComponent() {
  const logger = useLogger("MyComponent");

  logger.info("Message", { context: "data" });
  logger.error(new Error("Oops"));
}
```

## Best Practices

1. **Name loggers after their component/service**: `useLogger("AccountService")`
2. **Use appropriate log levels**:
   - `debug`: Verbose internal state
   - `info`: Important events (user actions, state transitions)
   - `warn`: Recoverable errors, deprecated usage
   - `error`: Actual errors that need attention
3. **Include context**: Pass objects with relevant data as additional arguments
4. **Don't log sensitive data**: Avoid logging passwords, tokens, PII
5. **Use composite loggers in production**: Combine console + error tracking service

## API Reference

### LoggerFactory

```tsx
interface LoggerFactory {
  loggerFor(name: string): Logger;
}
```

### Logger

```tsx
interface Logger {
  debug(...args: unknown[]): string;
  info(...args: unknown[]): string;
  warn(...args: unknown[]): string;
  error(...args: unknown[]): string;
}
```

### Hooks

- `useLogger(name: string): Logger` - Get a logger instance
- `useLoggerFactory(): LoggerFactory` - Get the factory instance
