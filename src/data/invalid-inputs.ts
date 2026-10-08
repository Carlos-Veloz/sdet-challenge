/** Shared negative-test data, taken from the constraints in the OpenAPI schemas. */

export const INVALID_AGES: Array<[label: string, value: unknown]> = [
  ['zero (below minimum 1)', 0],
  ['negative', -5],
  ['151 (above maximum 150)', 151],
  ['very large', 1_000_000],
  ['float', 25.5],
  ['numeric string', '30'],
  ['non-numeric string', 'abc'],
  ['null', null],
  ['boolean', true],
];

export const INVALID_EMAILS: Array<[label: string, value: unknown]> = [
  ['missing domain ("user@")', 'user@'],
  ['missing "@" ("user.domain.com")', 'user.domain.com'],
  ['missing local part', '@example.com'],
  ['double "@"', 'user@@example.com'],
  ['contains whitespace', 'us er@example.com'],
  ['empty string', ''],
  ['number', 12345],
  ['null', null],
];

export const INVALID_NAMES: Array<[label: string, value: unknown]> = [
  ['number', 123],
  ['null', null],
  ['boolean', false],
  ['object', { first: 'Jane' }],
];

export const REQUIRED_FIELDS = ['name', 'email', 'age'] as const;
