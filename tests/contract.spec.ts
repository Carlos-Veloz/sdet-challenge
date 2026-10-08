import { test, expect } from '../src/fixtures';
import { buildUser, missingEmail } from '../src/data/user.factory';
import {
  expectError,
  expectJsonContentType,
  expectSchema,
  expectStatus,
  explain,
} from '../src/support/assertions';

/**
 * Contract tests: every response is validated against the schemas extracted
 * from sdet_challenge_api.yaml (User, ErrorResponse), with
 * `additionalProperties: false` so undocumented fields are reported.
 */
test.describe('OpenAPI contract', { tag: '@contract' }, () => {
  test.describe('User schema', () => {
    test('GET /users: every item matches User', async ({ api, seedUser }) => {
      await seedUser();
      const res = await api.listUsers();
      expectStatus(res, 200);
      expectJsonContentType(res);
      expect(Array.isArray(res.body), explain(res)).toBe(true);
      for (const item of res.body ?? []) {
        expectSchema('User', { ...res, body: item });
      }
    });

    test('POST /users 201 matches User', async ({ api, tracker }) => {
      const user = buildUser();
      tracker.add(user.email);
      const res = await api.createUser(user);
      expectStatus(res, 201);
      expectJsonContentType(res);
      expectSchema('User', res);
    });

    test('GET /users/{email} 200 matches User', async ({ api, seedUser }) => {
      const user = await seedUser();
      const res = await api.getUser(user.email);
      expectStatus(res, 200);
      expectJsonContentType(res);
      expectSchema('User', res);
    });

    test('PUT /users/{email} 200 matches User', async ({ api, seedUser }) => {
      const user = await seedUser();
      const res = await api.updateUser(user.email, { ...user, age: 31 });
      expectStatus(res, 200);
      expectJsonContentType(res);
      expectSchema('User', res);
    });
  });

  test.describe('ErrorResponse schema', () => {
    test('POST /users 400', async ({ api }) => {
      expectError(await api.createUser({ name: 'x' }), 400);
    });

    test('POST /users 409', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.createUser(user), 409);
    });

    test('GET /users/{email} 404', async ({ api }) => {
      expectError(await api.getUser(missingEmail()), 404);
    });

    test('PUT /users/{email} 400', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.updateUser(user.email, { ...user, age: 0 }), 400);
    });

    test('PUT /users/{email} 404', async ({ api }) => {
      const ghost = buildUser({ email: missingEmail() });
      expectError(await api.updateUser(ghost.email, ghost), 404);
    });

    test('PUT /users/{email} 409', async ({ api, seedUser }) => {
      const a = await seedUser();
      const b = await seedUser();
      expectError(await api.updateUser(b.email, { ...b, email: a.email }), 409);
    });

    test('DELETE /users/{email} 401', async ({ api, seedUser }) => {
      const user = await seedUser();
      expectError(await api.deleteUser(user.email, { token: null }), 401);
    });

    test('DELETE /users/{email} 404', async ({ api }) => {
      expectError(await api.deleteUser(missingEmail()), 404);
    });

    test('error message is a non-empty string', async ({ api }) => {
      const res = await api.getUser(missingEmail());
      expectStatus(res, 404);
      const message = (res.body as { error?: unknown } | undefined)?.error;
      expect(typeof message === 'string' && message.length > 0, explain(res)).toBe(true);
    });
  });
});
