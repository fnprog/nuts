import { ConsoleLoggerFactory } from "@nuts/logging";

const factory = new ConsoleLoggerFactory();
export const logger = factory.loggerFor("nuts");

