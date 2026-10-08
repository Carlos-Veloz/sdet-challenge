import { test, expect } from '../src/fixtures';
import { missingEmail } from '../src/data/user.factory';
import { expectError, expectSchema, expectStatus, explain } from '../src/support/assertions';

test.describe('GET /{env}/users/{email}', () => {
  test('returns 200 and the requested user', async ({ api, seedUser }) => {
    const user = await seedUser();
    const res = await api.getUser(user.email);
    expectStatus(res, 200);
    expectSchema('User', res);
    expect(res.body, explain(res)).toEqual(user);
  });

  test('resolves emails containing "+" (URL-encoded)', async ({ api, seedUser }) => {
    const user = await seedUser({ email: `plus+${Date.now()}@example.com` });
    const res = await api.getUser(user.email);
    expectStatus(res, 200);
    expect((res.body as { email: string }).email, explain(res)).toBe(user.email);
  });

  test('returns 404 with an ErrorResponse for an unknown email', async ({ api }) => {
    expectError(await api.getUser(missingEmail()), 404);
  });

  test('returns 404 for a deleted user', async ({ api, seedUser }) => {
    const user = await seedUser();
    expectStatus(await api.deleteUser(user.email), 204);
    expectError(await api.getUser(user.email), 404);
  });

  test('does not require authentication', async ({ api, seedUser }) => {
    const user = await seedUser();
    expectStatus(await api.getUser(user.email), 200);
  });
});
