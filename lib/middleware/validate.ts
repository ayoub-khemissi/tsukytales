import type { z } from "zod/v4";

import { AppError } from "@/lib/errors/app-error";

export function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const messages = result.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new AppError(messages, 400);
  }

  return result.data;
}
