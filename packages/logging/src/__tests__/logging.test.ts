import { describe, it, expect } from "vitest";
import {
  ConsoleLoggerFactory,
  VoidLoggerFactory,
  RecordingLoggerFactory,
  CompositeLoggerFactory,
  SampledLoggerFactory,
  DeferredLogger,
  DeferredLoggerFactory,
} from "../index";

describe("Logging Package", () => {
  describe("ConsoleLoggerFactory", () => {
    it("creates logger with correct name", () => {
      const factory = new ConsoleLoggerFactory();
      const logger = factory.loggerFor("TestLogger");
      expect(logger).toBeDefined();
    });
  });

  describe("VoidLoggerFactory", () => {
    it("creates logger that does nothing", () => {
      const factory = new VoidLoggerFactory();
      const logger = factory.loggerFor("Test");

      expect(logger.debug("test")).toBe("");
      expect(logger.info("test")).toBe("");
      expect(logger.warn("test")).toBe("");
      expect(logger.error("test")).toBe("");
    });
  });

  describe("RecordingLoggerFactory", () => {
    it("records log messages", () => {
      const factory = new RecordingLoggerFactory();
      const logger = factory.loggerFor("Test");

      logger.info("test message");
      logger.error("error message", { context: "data" });

      const records = factory.getRecords("Test");
      expect(records).toHaveLength(2);
      expect(records[0].level).toBe("info");
      expect(records[0].args).toEqual(["test message"]);
      expect(records[1].level).toBe("error");
      expect(records[1].args).toEqual(["error message", { context: "data" }]);
    });

    it("clears records for specific logger", () => {
      const factory = new RecordingLoggerFactory();
      const logger1 = factory.loggerFor("Test1");
      const logger2 = factory.loggerFor("Test2");

      logger1.info("message 1");
      logger2.info("message 2");

      factory.clear("Test1");

      expect(factory.getRecords("Test1")).toHaveLength(0);
      expect(factory.getRecords("Test2")).toHaveLength(1);
    });

    it("clears all records", () => {
      const factory = new RecordingLoggerFactory();
      const logger1 = factory.loggerFor("Test1");
      const logger2 = factory.loggerFor("Test2");

      logger1.info("message 1");
      logger2.info("message 2");

      factory.clear();

      expect(factory.getRecords("Test1")).toHaveLength(0);
      expect(factory.getRecords("Test2")).toHaveLength(0);
    });
  });

  describe("CompositeLoggerFactory", () => {
    it("logs to multiple loggers", () => {
      const recording1 = new RecordingLoggerFactory();
      const recording2 = new RecordingLoggerFactory();
      const factory = new CompositeLoggerFactory([recording1, recording2]);

      const logger = factory.loggerFor("Test");
      logger.info("test message");

      expect(recording1.getRecords("Test")).toHaveLength(1);
      expect(recording2.getRecords("Test")).toHaveLength(1);
    });
  });

  describe("SampledLoggerFactory", () => {
    it("samples at 0% rate", () => {
      const recording = new RecordingLoggerFactory();
      const factory = new SampledLoggerFactory(recording, 0);
      const logger = factory.loggerFor("Test");

      for (let i = 0; i < 100; i++) {
        logger.info("message");
      }

      expect(recording.getRecords("Test").length).toBe(0);
    });

    it("samples at 100% rate", () => {
      const recording = new RecordingLoggerFactory();
      const factory = new SampledLoggerFactory(recording, 1);
      const logger = factory.loggerFor("Test");

      for (let i = 0; i < 10; i++) {
        logger.info("message");
      }

      expect(recording.getRecords("Test").length).toBe(10);
    });
  });

  describe("DeferredLoggerFactory", () => {
    it("queues logs until flushed", () => {
      const recording = new RecordingLoggerFactory();
      const factory = new DeferredLoggerFactory(recording);
      const logger = factory.loggerFor("Test") as DeferredLogger;

      logger.info("message 1");
      logger.info("message 2");

      expect(recording.getRecords("Test")).toHaveLength(0);

      logger.flush();

      expect(recording.getRecords("Test")).toHaveLength(2);
    });

    it("logs directly after flush", () => {
      const recording = new RecordingLoggerFactory();
      const factory = new DeferredLoggerFactory(recording);
      const logger = factory.loggerFor("Test") as DeferredLogger;

      logger.info("message 1");
      logger.flush();
      logger.info("message 2");

      expect(recording.getRecords("Test")).toHaveLength(2);
    });
  });
});
