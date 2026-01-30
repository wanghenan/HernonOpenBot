import { z, type ZodTypeAny, ZodError } from "zod";

type CachedValidator = {
  parse: (value: unknown) => unknown;
  schema: Record<string, unknown>;
};

const schemaCache = new Map<string, CachedValidator>();

function formatZodErrors(error: ZodError): string[] {
  if (!error || error.issues.length === 0) return ["invalid config"];
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    const message = issue.message;
    return `${path}: ${message}`;
  });
}

export function validateJsonSchemaValue(params: {
  schema: Record<string, unknown>;
  cacheKey: string;
  value: unknown;
}): { ok: true } | { ok: false; errors: string[] } {
  let cached = schemaCache.get(params.cacheKey);
  if (!cached || cached.schema !== params.schema) {
    const zodSchema = z.record(z.string(), z.unknown());
    cached = { parse: zodSchema.parse, schema: params.schema };
    schemaCache.set(params.cacheKey, cached);
  }

  try {
    cached.parse(params.value);
    return { ok: true };
  } catch (error) {
    if (error instanceof ZodError) {
      return { ok: false, errors: formatZodErrors(error) };
    }
    return { ok: false, errors: ["invalid config"] };
  }
}
