import { randomUUID } from 'node:crypto';
import type { User } from '../clients/user-api.client';

/** Unique, valid user. A unique email per test keeps tests independent and parallel-safe. */
export function buildUser(overrides: Partial<User> = {}): User {
  const id = randomUUID().slice(0, 12);
  return {
    name: `QA User ${id}`,
    email: `qa.${id}@example.com`,
    age: 30,
    ...overrides,
  };
}

export const uniqueEmail = (): string => buildUser().email;

/** A valid-looking email that is guaranteed not to exist. */
export const missingEmail = (): string => `missing.${randomUUID().slice(0, 12)}@example.com`;
