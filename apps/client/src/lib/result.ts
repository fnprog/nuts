import { Result, ok, err, ResultAsync } from "neverthrow";
import { parseApiError, ParsedApiError } from "./error";
import { ServiceError } from "./service-error";

export { Result, ok, err, ResultAsync, ServiceError };

export const safeFetch = <T>(promise: Promise<T>): ResultAsync<T, ParsedApiError> => {
  return ResultAsync.fromPromise(promise, (error) => parseApiError(error));
};

export type SafeResult<T, E = string> = Result<T, E>;
export type SafeResultAsync<T, E = string> = ResultAsync<T, E>;
