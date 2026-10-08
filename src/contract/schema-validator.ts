import fs from 'node:fs';
import path from 'node:path';
import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import yaml from 'js-yaml';

type JsonSchema = Record<string, unknown>;
interface OpenApiDocument {
  components: { schemas: Record<string, JsonSchema> };
}

export type SchemaName = 'User' | 'ErrorResponse';

const SPEC_PATH = path.resolve(__dirname, '../../spec/sdet_challenge_api.yaml');

/**
 * Schemas are read straight from the OpenAPI document, so the contract used by
 * the tests can never drift from the specification. OpenAPI 3.0 component
 * schemas used here are valid JSON Schema, apart from the `example` keyword
 * which Ajv ignores in non-strict mode.
 *
 * `additionalProperties: false` is added to make the contract strict: an
 * undocumented field in a response is reported as a discrepancy.
 */
const spec = yaml.load(fs.readFileSync(SPEC_PATH, 'utf8')) as OpenApiDocument;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validators = new Map<SchemaName, ValidateFunction>();
for (const name of ['User', 'ErrorResponse'] as const) {
  validators.set(
    name,
    ajv.compile({ ...spec.components.schemas[name], additionalProperties: false }),
  );
}

export interface SchemaResult {
  valid: boolean;
  errors: string;
}

export function validateSchema(name: SchemaName, data: unknown): SchemaResult {
  const validate = validators.get(name)!;
  const valid = validate(data) as boolean;
  const errors = (validate.errors ?? [])
    .map((e) => `${e.instancePath || '(root)'} ${e.message}`)
    .join('; ');
  return { valid, errors };
}
