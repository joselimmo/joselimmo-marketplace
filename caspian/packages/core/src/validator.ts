import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import { loadEnvelopeSchema } from "./schemas/loader.js";

let cachedValidator: ValidateFunction | null = null;

export async function getEnvelopeValidator(): Promise<ValidateFunction> {
  if (cachedValidator !== null) {
    return cachedValidator;
  }

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const schema = await loadEnvelopeSchema();
  const compiled = ajv.compile(schema);
  cachedValidator = compiled;
  return compiled;
}
