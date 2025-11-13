export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "ServiceError";
    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  static initialization(message: string, cause?: unknown): ServiceError {
    return new ServiceError(message, "INITIALIZATION_ERROR", cause);
  }

  static notFound(resource: string, id?: string): ServiceError {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new ServiceError(message, "NOT_FOUND", undefined);
  }

  static operation(operation: string, resource: string, cause?: unknown): ServiceError {
    return new ServiceError(`Failed to ${operation} ${resource}`, "OPERATION_FAILED", cause);
  }

  static unavailable(feature: string): ServiceError {
    return new ServiceError(`${feature} not available in offline mode`, "FEATURE_UNAVAILABLE", undefined);
  }

  static database(message: string, cause?: unknown): ServiceError {
    return new ServiceError(message, "DATABASE_ERROR", cause);
  }

  static fromAxiosError(error: unknown): ServiceError {
    if (error && typeof error === "object" && "response" in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message || "Network request failed";

      if (status === 404) {
        return new ServiceError(message, "NOT_FOUND", error);
      }
      if (status === 401 || status === 403) {
        return new ServiceError(message, "UNAUTHORIZED", error);
      }
      if (status && status >= 500) {
        return new ServiceError(message, "SERVER_ERROR", error);
      }

      return new ServiceError(message, "NETWORK_ERROR", error);
    }

    if (error instanceof Error) {
      return new ServiceError(error.message, "UNKNOWN_ERROR", error);
    }

    return new ServiceError("An unknown error occurred", "UNKNOWN_ERROR", error);
  }

  static sync(operation: string, cause?: unknown): ServiceError {
    return new ServiceError(`Sync operation failed: ${operation}`, "SYNC_ERROR", cause);
  }

  static storage(message: string, cause?: unknown): ServiceError {
    return new ServiceError(`Storage operation failed: ${message}`, "STORAGE_ERROR", cause);
  }

  static merge(message: string, cause?: unknown): ServiceError {
    return new ServiceError(`CRDT merge failed: ${message}`, "MERGE_ERROR", cause);
  }

  static internal(context: string, message: string, cause?: unknown): ServiceError {
    return new ServiceError(`Internal error in ${context}: ${message}`, "INTERNAL_ERROR", cause);
  }
}
