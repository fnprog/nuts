import type { ValidationFieldError } from "@nuts/types";

export interface ParsedError {
  userMessage: string;
  type: "validation" | "common" | "network" | "client" | "unknown";
  validationErrors?: ValidationFieldError[];
  originalError: unknown;
  statusCode?: number;
  errorCode?: string;
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public validationErrors?: ValidationFieldError[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string = "Network error occurred") {
    super(message);
    this.name = "NetworkError";
  }
}
