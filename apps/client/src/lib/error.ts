import { HTTPError } from "ky";

interface ValidationFieldError {
  field: string;
  message: string;
}

// Represents the structure of your backend's API error response
interface ApiRawErrorResponse {
  status: string;
  message?: string; // For common errors like "User already exists"
  error?: ValidationFieldError[]; // For detailed validation errors as an array
}

export interface ParsedApiError {
  userMessage: string;
  type: "validation" | "common" | "network" | "client" | "unknown";
  validationErrors?: ValidationFieldError[];
  originalError: unknown;
  statusCode?: number;
  // axiosErrorCode is obsolete; kept as undefined for backward compat
  axiosErrorCode?: string;
}

/**
 * Parses a raw error object (e.g., from a ky API call or general error)
 * into a structured, user-friendly format.
 * This function does NOT perform side effects (like showing toasts or logging).
 * @param error The raw error object caught from a try...catch block.
 * @returns A ParsedApiError object containing the user-friendly message and other details.
 */
export function parseApiError(error: unknown): ParsedApiError {
  let userMessage: string = "An unexpected error occurred. Please try again.";
  let type: ParsedApiError["type"] = "unknown";
  let validationErrors: ValidationFieldError[] | undefined;
  let statusCode: number | undefined;

  // ky throws HTTPError for non-2xx
  if (error instanceof HTTPError) {
    statusCode = error.response.status;
    type = "common"; // May change to validation or other after inspecting body
    try {
      // Attempt to parse structured error JSON
      // .clone() because .json() consumes the stream
      const clonedResponse = error.response.clone();
      return clonedResponse
        .json()
        .then((apiResponseData: ApiRawErrorResponse) => {
          // Prioritize specific validation errors if present
          if (Array.isArray(apiResponseData.error) && apiResponseData.error.length > 0) {
            type = "validation";
            validationErrors = apiResponseData.error;
            userMessage = apiResponseData.error.map((e) => e.message).join("\n");
            if (userMessage.length === 0 && typeof apiResponseData.message === "string") {
              userMessage = apiResponseData.message;
            } else if (userMessage.length === 0) {
              userMessage = "Validation failed with no specific error messages provided.";
            }
          }
          // Fallback to message
          else if (typeof apiResponseData.message === "string" && apiResponseData.message.length > 0) {
            type = "common";
            userMessage = apiResponseData.message;
          }
          // Structure did not match expectation
          else {
            type = "unknown";
            userMessage = apiResponseData.message || `An unknown API error occurred with status ${statusCode}.`;
          }
          return {
            userMessage,
            type,
            validationErrors,
            originalError: error,
            statusCode,
            axiosErrorCode: undefined,
          };
        })
        .catch(() => ({
          userMessage: `API error with status ${statusCode}`,
          type,
          originalError: error,
          statusCode,
          axiosErrorCode: undefined,
        }));
    } catch {
      userMessage = `API error with status ${statusCode}`;
      type = "common";
    }
  }
  // Network (fetch) errors, timeout, etc
  else if (error instanceof TypeError && error.message && error.message.toLowerCase().includes("network")) {
    type = "network";
    userMessage = "A network error occurred. Please check your internet connection.";
  }
  // Plain JS error
  else if (error instanceof Error) {
    type = "client";
    userMessage = error.message || "An unexpected client-side error occurred.";
  }
  // Unknown/non-error case
  return {
    userMessage,
    type,
    validationErrors,
    originalError: error,
    statusCode,
    axiosErrorCode: undefined,
  };
}
