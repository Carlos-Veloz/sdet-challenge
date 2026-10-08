import { test as base, expect } from '@playwright/test';
import { UserApiClient, type User } from '../clients/user-api.client';
import type { Environment } from '../config/env';
import { buildUser } from '../data/user.factory';
import { expectStatus } from '../support/assertions';

interface Fixtures {
  /** Client bound to the environment of the running Playwright project. */
  api: UserApiClient;
  /** Emails registered here are deleted (best effort) after the test. */
  tracker: Set<string>;
  /** Creates a valid user through the API (asserting 201) and schedules its cleanup. */
  seedUser: (overrides?: Partial<User>) => Promise<User>;
}

export interface TestOptions {
  /** Set per project in playwright.config.ts */
  env: Environment;
}

export const test = base.extend<Fixtures & TestOptions>({
  env: ['dev', { option: true }],

  api: async ({ request, env }, use) => {
    await use(new UserApiClient(request, env));
  },

  tracker: async ({ api }, use) => {
    const emails = new Set<string>();
    await use(emails);
    for (const email of emails) {
      await api.deleteUser(email).catch(() => undefined);
    }
  },

  seedUser: async ({ api, tracker }, use) => {
    await use(async (overrides = {}) => {
      const user = buildUser(overrides);
      tracker.add(user.email);
      const res = await api.createUser(user);
      expectStatus(res, 201);
      return user;
    });
  },
});

export { expect };
