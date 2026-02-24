import { ZodType } from "zod";
import { AppError } from "./errors";

export function validate<T>(data: T, schema: ZodType): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(`Validation Failed: ${result.error.message}`, 400);
  }

  return result.data as T;
}
