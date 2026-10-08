import { expect } from '@playwright/test';
import type { ApiResult } from '../clients/user-api.client';
import { type SchemaName, validateSchema } from '../contract/schema-validator';

/** Human-readable dump of a response, appended to every assertion message. */
export function explain(res: ApiResult): string {
  return `${res.method} ${res.url} -> HTTP ${res.status}\nResponse body: ${res.text || '(empty)'}`;
}

export function expectStatus(res: ApiResult, expected: number): void {
  expect(res.status, `Expected HTTP ${expected} per OpenAPI.\n${explain(res)}`).toBe(expected);
}

export function expectSchema(name: SchemaName, res: ApiResult): void {
  const { valid, errors } = validateSchema(name, res.body);
  expect(valid, `Body does not match schema "${name}": ${errors}\n${explain(res)}`).toBe(true);
}

export function expectJsonContentType(res: ApiResult): void {
  expect(res.headers['content-type'] ?? '', `Expected JSON content-type.\n${explain(res)}`).toMatch(
    /application\/json/i,
  );
}

/** Status code + ErrorResponse schema + JSON content type. */
export function expectError(res: ApiResult, status: number): void {
  expectStatus(res, status);
  expectJsonContentType(res);
  expectSchema('ErrorResponse', res);
}
