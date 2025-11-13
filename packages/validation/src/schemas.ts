import { type Type } from "arktype";
import { Result, ok, err } from "neverthrow";

export { type, Type } from "arktype";
export { Result, ok, err, ResultAsync } from "neverthrow";

export interface SchemaValidationError {
  path: string;
  message: string;
}

export const validateData = <T>(data: unknown, schema: Type<T>): Result<T, SchemaValidationError[]> => {
  const result = schema(data);

  if (result instanceof Error || (result as any).problems) {
    const problems = (result as any).problems || [];
    const errors: SchemaValidationError[] = problems.map((error: any) => ({
      path: error.path?.join(".") || "root",
      message: error.message,
    }));
    return err(errors);
  }

  return ok(result as T);
};

export const validateOrThrow = <T>(data: unknown, schema: Type<T>): T => {
  const result = validateData(data, schema);

  if (result.isErr()) {
    const errorMessage = result.error.map((e) => `${e.path}: ${e.message}`).join(", ");
    throw new Error(`Validation failed: ${errorMessage}`);
  }

  return result.value;
};
