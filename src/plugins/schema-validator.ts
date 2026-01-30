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

/**
 * Converts a JSON Schema object to a Zod schema for validation.
 */
function jsonSchemaToZod(schema: Record<string, unknown>): ZodTypeAny {
  const type = schema.type;
  const nullable = schema.nullable === true;

  // Handle object type
  if (
    type === "object" ||
    (!type && (schema.properties || schema.additionalProperties !== undefined))
  ) {
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
    const additionalProperties = schema.additionalProperties;

    const zodShape: Record<string, ZodTypeAny> = {};

    if (properties) {
      for (const [key, propSchema] of Object.entries(properties)) {
        zodShape[key] = jsonSchemaToZod(propSchema as Record<string, unknown>);
      }
    }

    let additionalPropSchema: ZodTypeAny | true | undefined;
    if (additionalProperties === false) {
      additionalPropSchema = z.unknown().optional();
    } else if (typeof additionalProperties === "object") {
      additionalPropSchema = jsonSchemaToZod(additionalProperties as Record<string, unknown>);
    }

    const objectSchema = z.object(zodShape);

    if (additionalPropSchema === true || additionalPropSchema === undefined) {
      return nullable ? objectSchema.nullable() : objectSchema;
    }

    return nullable
      ? objectSchema.catchall(additionalPropSchema).nullable()
      : objectSchema.catchall(additionalPropSchema);
  }

  // Handle array type
  if (type === "array") {
    const items = schema.items as Record<string, unknown> | undefined;
    const itemSchema = items ? jsonSchemaToZod(items) : z.unknown();
    const arraySchema = z.array(itemSchema);
    return nullable ? arraySchema.nullable() : arraySchema;
  }

  // Handle string type
  if (type === "string") {
    const stringSchema = z.string();
    if (schema.format === "uri" || schema.format === "uri-reference") {
      // Keep as string but could add URI validation if needed
    }
    return nullable ? stringSchema.nullable() : stringSchema;
  }

  // Handle number type
  if (type === "number") {
    const numberSchema = z.number();
    return nullable ? numberSchema.nullable() : numberSchema;
  }

  // Handle integer type
  if (type === "integer") {
    const intSchema = z.number().int();
    return nullable ? intSchema.nullable() : intSchema;
  }

  // Handle boolean type
  if (type === "boolean") {
    const boolSchema = z.boolean();
    return nullable ? boolSchema.nullable() : boolSchema;
  }

  // Handle null type
  if (type === "null") {
    return nullable ? z.null().nullable() : z.null();
  }

  // Handle enum type
  const enumValues = schema.enum;
  if (enumValues && Array.isArray(enumValues)) {
    const enumSchema = z.enum(enumValues as [string, ...string[]]);
    return nullable ? enumSchema.nullable() : enumSchema;
  }

  // Handle oneOf type
  const oneOf = schema.oneOf as Record<string, unknown>[] | undefined;
  if (oneOf && Array.isArray(oneOf)) {
    const options = oneOf.map((s) => jsonSchemaToZod(s));
    const unionSchema = z.union(options as [ZodTypeAny, ...ZodTypeAny[]]);
    return nullable ? unionSchema.nullable() : unionSchema;
  }

  // Handle anyOf type
  const anyOf = schema.anyOf as Record<string, unknown>[] | undefined;
  if (anyOf && Array.isArray(anyOf)) {
    const options = anyOf.map((s) => jsonSchemaToZod(s));
    const unionSchema = z.union(options as [ZodTypeAny, ...ZodTypeAny[]]);
    return nullable ? unionSchema.nullable() : unionSchema;
  }

  // Default: accept any value
  return nullable ? z.unknown().nullable() : z.unknown();
}

export function validateJsonSchemaValue(params: {
  schema: Record<string, unknown>;
  cacheKey: string;
  value: unknown;
}): { ok: true } | { ok: false; errors: string[] } {
  let cached = schemaCache.get(params.cacheKey);
  if (!cached || cached.schema !== params.schema) {
    try {
      const zodSchema = jsonSchemaToZod(params.schema);
      cached = { parse: zodSchema.parse.bind(zodSchema), schema: params.schema };
      schemaCache.set(params.cacheKey, cached);
    } catch {
      // If we can't convert the schema, fall back to permissive validation
      cached = { parse: (v: unknown) => v, schema: params.schema };
      schemaCache.set(params.cacheKey, cached);
    }
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
